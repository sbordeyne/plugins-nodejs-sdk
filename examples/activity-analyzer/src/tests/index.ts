import "mocha";
import {core, helpers} from "@mediarithmics/plugins-nodejs-sdk";
import {MyActivityAnalyzerPlugin} from "../MyPluginImpl";

describe("Test Example Activity Analyzer", function () {

    const activityAnalyzerProperties: core.PluginPropertyResponse = {
        count: 1,
        data: [
            {
                technical_name: "analyzer_rules",
                value: {
                    uri:
                        "mics://data_file/tenants/10001/plugins_conf/activity_analyzer.conf",
                    last_modified: 123456
                },
                property_type: "DATA_FILE",
                origin: "PLUGIN",
                writable: true,
                deletable: true
            }
        ],
        status: "ok"
    };

    const itFactory = helpers.itFactory(new MyActivityAnalyzerPlugin(), activityAnalyzerProperties);

    itFactory(
        "Check behavior of dummy activity analyzer",
        require(`${process.cwd()}/src/tests/activity_input`),
        require(`${process.cwd()}/src/tests/activity_output`),
    );
});
