import { core } from "@mediarithmics/plugins-nodejs-sdk";
import { MyInstanceContext } from "./MyInstanceContext";
import * as rp from "request-promise-native";
import * as retry from "retry";

export interface MailjetSentResponse {
  Sent: {
    Email: string;
    MessageID: number;
  }[];
}

export interface MailjetPayload {
  datamartId: string;
  campaignId: string;
  creativeId: string;
  emailHash: string;
  routerId: string;
  ts: string;
}

// See https://dev.mailjet.com/guides/#events
export interface MailjetEvent {
  event: "open" | "click" | "bounce" | "blocked" | "spam" | "unsub" | "sent";
  time: number;
  email: string;
  mj_campaign_id: number;
  mj_contact_id: number;
  customcampaign: string;
  CustomID: string;
  Payload: MailjetPayload;
  MessageID: number;
  blocked?: boolean;
  hard_bounce?: boolean;
  error_related_to?: string;
  error?: string;
  ip?: string;
  geo?: string;
  agent?: string;
  url?: string;
  source?: string;
  mj_list_id: number;
}

export class MySimpleEmailRouter extends core.EmailRouterPlugin {
  /**
   * Helpers
   */

  buildMailjetPayload(
    datamartId: string,
    campaignId: string,
    creativeId: string,
    emailHash: string,
    routerId: string
  ): MailjetPayload {
    return {
      datamartId: datamartId,
      campaignId: campaignId,
      creativeId: creativeId,
      emailHash: emailHash,
      routerId: routerId,
      ts: new Date().toString()
    };
  }

  /**
   * Mailjet Send Email
   */

  async sendEmail(
    request: core.EmailRoutingRequest,
    identifier: core.UserEmailIdentifierInfo,
    payload: MailjetPayload
  ): Promise<MailjetSentResponse> {
    this.logger.debug(
      `Sending email to: request: ${JSON.stringify(
        request
      )} - identifier: ${JSON.stringify(
        identifier
      )} - payload: ${JSON.stringify(payload)}`
    );

    const emailHeaders = {
      "Reply-To": request.meta.reply_to
    };

    const emailData = {
      FromEmail: request.meta.from_email,
      FromName: request.meta.from_name,
      Headers: emailHeaders,
      Subject: request.meta.subject_line,
      "Text-part": request.content.text,
      "Html-part": request.content.html,
      Recipients: [
        {
          Email: identifier.email || request.meta.to_email
        }
      ],
      "Mj-EventPayLoad": JSON.stringify(payload),
      "Mj-campaign": request.campaign_id
    };

    const mailjetResponse: MailjetSentResponse = await this.requestGatewayHelper(
      "POST",
      `${
        this.outboundPlatformUrl
      }/v1/external_services/technical_name=mailjet/call`,
      emailData
    );

    if (mailjetResponse.Sent.length === 0) {
      this.logger.error("Mailjet sent an empty response, will retry");
      throw new Error("Mailjet sent an empty response, will retry");
    }

    return mailjetResponse;
  }

  createEmailTrackingActivity(
    event: MailjetEvent,
    eventName: string,
    payload: MailjetPayload
  ): core.UserActivity {
    const now = Date.now();

    return ({
      $type: "EMAIL",
      $source: "API",
      $ts: now,
      $email_hash: {
        $hash: payload.emailHash
      },
      $datamart_id: payload.datamartId,
      $events: [
        {
          $ts: now,
          $event_name: eventName,
          $properties: {
            $delivery_id: "" + event.MessageID
          }
        }
      ],
      $origin: {
        $ts: now,
        $campaign_id: payload.campaignId,
        $creative_id: payload.creativeId
      }
    } as any) as core.UserActivity;
  }

  processMailjetEventToMicsTrackingActivity(
    mailjetEvent: MailjetEvent
  ): core.UserActivity {
    switch (mailjetEvent.event) {
      case "open":
        return this.createEmailTrackingActivity(
          mailjetEvent,
          "$email_view",
          mailjetEvent.Payload
        );
      case "click":
        return this.createEmailTrackingActivity(
          mailjetEvent,
          "$email_click",
          mailjetEvent.Payload
        );
      case "bounce":
        if (
          mailjetEvent.blocked === true ||
          mailjetEvent.hard_bounce === true
        ) {
          return this.createEmailTrackingActivity(
            mailjetEvent,
            "$email_hard_bounce",
            mailjetEvent.Payload
          );
        } else {
          return this.createEmailTrackingActivity(
            mailjetEvent,
            "$email_soft_bounce",
            mailjetEvent.Payload
          );
        }
      case "blocked":
        return this.createEmailTrackingActivity(
          mailjetEvent,
          "$email_hard_bounce",
          mailjetEvent.Payload
        );
      case "spam":
        return this.createEmailTrackingActivity(
          mailjetEvent,
          "$email_complaint",
          mailjetEvent.Payload
        );
      case "unsub":
        return this.createEmailTrackingActivity(
          mailjetEvent,
          "$email_unsubscribe",
          mailjetEvent.Payload
        );
      default:
        throw new Error(
          `POST /v1/email_events: Received ${
            mailjetEvent.event
          } - We're not handling this event YET. With Payload ${JSON.stringify(
            mailjetEvent.Payload
          )}`
        );
    }
  }

  sendUserActivityEvent(
    datamartId: string,
    emailUserActivity: core.UserActivity,
    authenticationToken: string
  ) {
    const uri =
      (process.env.OUTBOUND_PLATFORM_URL || "https://api.mediarithmics.com") +
      "/v1/datamarts/" +
      datamartId +
      "/user_activities";

    const options = {
      method: "POST",
      uri: uri,
      body: emailUserActivity,
      json: true,
      headers: {
        Authorization: authenticationToken
      }
    };

    this.logger.debug(
      `Sending email user activity to the timeline: ${JSON.stringify(
        emailUserActivity
      )}`
    );

    return rp(options).catch(function(e) {
      if (e.name === "StatusCodeError") {
        throw new Error(
          `Error while calling ${options.method} '${
            options.uri
          }' with the request body '${JSON.stringify(options.body) ||
            ""}': got a ${e.response.statusCode} ${
            e.response.statusMessage
          } with the response body ${JSON.stringify(e.response.body)}`
        );
      } else {
        throw e;
      }
    });
  }

  initMailjetNotificationRoute() {
    // Return an emailRoutingResponse
    // Mailjet notify entry point for events such as sent, open, click, bounce, spam, blocked etc...
    this.app.post(
      "/r/external_token_to_be_provided_by_your_account_manager", // This will be listening on : https://plugins.mediarithmics.io/r/external_token_to_be_provided_by_your_account_manager
      async (req, res) => {
        const emailEvent = req.body;
        this.logger.debug(
          "POST /r/external_token_to_be_provided_by_your_account_manager",
          JSON.stringify(emailEvent)
        );
        try {
          if (!emailEvent) {
            this.logger.error(
              "POST /r/external_token_to_be_provided_by_your_account_manager: Missing email event"
            );
            return res.status(400).json({
              Result: "Missing email event"
            });
          }

          if (!emailEvent.Payload || !emailEvent.MessageID) {
            this.logger.error(
              "POST /r/external_token_to_be_provided_by_your_account_manager: Missing Payload or MessageID"
            );
            return res.status(400).json({
              Result: "Missing Payload or MessageID"
            });
          }

          if (
            JSON.stringify(emailEvent.Payload) === "" &&
            emailEvent.MessageID === 0
          ) {
            // If test sent with mailjet
            return res.status(200).json({
              Result: "Considered as test. Success."
            });
          } else {
            const mailjetEvent = JSON.parse(emailEvent) as MailjetEvent;
            const payload = mailjetEvent.Payload;

            const props = (await this.getInstanceContext(
              payload.routerId
            )) as MyInstanceContext;
            const micsActivity = this.processMailjetEventToMicsTrackingActivity(
              mailjetEvent
            );

            try {
              await this.sendUserActivityEvent(
                payload.datamartId,
                micsActivity,
                props.authenticationToken
              );

              return res.status(200).json({
                Result: `Event ${emailEvent.event} successfully sent`
              });
            } catch (err) {
              this.logger.error(
                `POST /r/external_token_to_be_provided_by_your_account_manager: Failed to integrate event ${
                  emailEvent.event
                } Error: ${err.message} - ${err.stack}`
              );
              return res.status(400).json({
                Result: `Failed to integrate event ${emailEvent.event} Error: ${
                  err.message
                } - ${err.stack}`
              });
            }
          }
        } catch (err) {
          this.logger.error(
            `POST /r/external_token_to_be_provided_by_your_account_manager: Failed because of Error: ${
              err.message
            } - ${err.stack}`
          );
          return res.status(500).json({
            Result: `${err.message} - ${err.stack}`
          });
        }
      }
    );
  }

  protected async instanceContextBuilder(
    routerId: string
  ): Promise<MyInstanceContext> {
    const defaultInstanceContext = await super.instanceContextBuilder(routerId);
    const authenticationToken = defaultInstanceContext.properties.findStringProperty("authentication_token");

    if (authenticationToken && authenticationToken.value.value) {
      return {
        ...defaultInstanceContext,
        authenticationToken: authenticationToken.value.value
      };
    } else {
      this.logger.error(
        `There is no authentification_token configured for routerId: ${
          routerId
        }`
      );
      throw Error(
        `There is no authentification_token configured for routerId: ${
          routerId
        }`
      );
    }
  }

  protected async onEmailCheck(
    request: core.CheckEmailsRequest,
    instanceContext: core.EmailRouterBaseInstanceContext
  ): Promise<core.CheckEmailsPluginResponse> {
    // Mailjet can send emails to every email adress.
    // Trust me, I've seen it.
    return Promise.resolve({ result: true });
  }

  protected async onEmailRouting(
    request: core.EmailRoutingRequest,
    instanceContext: core.EmailRouterBaseInstanceContext
  ): Promise<core.EmailRoutingPluginResponse> {
    const identifier = request.user_identifiers.find(identifier => {
      return (
        identifier.type === "USER_EMAIL" &&
        !!(identifier as core.UserEmailIdentifierInfo).email
      );
    }) as core.UserEmailIdentifierInfo;

    if (!identifier) {
      throw Error("No clear email identifiers were provided");
    }

    const payload = this.buildMailjetPayload(
      request.datamart_id,
      request.datamart_id,
      request.creative_id,
      identifier.hash,
      request.email_router_id
    );

    // As Mailjet can be a little difficult when shotting an email, we'll try a lot of time
    const mailjetResponse: MailjetSentResponse = await this.retryPromiseHelper(
      this.sendEmail,
      [request, identifier, payload]
    );

    if (mailjetResponse.Sent.length > 0) {
      return { result: true };
    } else {
      return { result: false };
    }
  }

  retryPromiseHelper(mainFn: Function, args: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
      const operation = retry.operation();
      operation.attempt(async attempt => {
        try {
          this.logger.debug(
            `Trying to call for the ${attempt}th time ${mainFn.name}`
          );

          const response = await mainFn.apply(this, args);
          resolve(response);
        } catch (err) {
          if (operation.retry(err)) {
            return;
          }
          reject(operation.mainError());
        }
      });
    });
  }

  constructor(enableThrottling = false) {
    super(enableThrottling);
    this.initMailjetNotificationRoute();
  }
}
