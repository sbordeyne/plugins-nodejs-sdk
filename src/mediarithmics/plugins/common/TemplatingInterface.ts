/**
 * Represent a Macro found in a template. If should be stored as an array to represent 'sub level' in the macro.
 *
 * Examples (with Handlebars macros):
 * `{{HELLO_WORLD}}` should return { "parts": ["HELLO_WORLD"]}
 * `{{HELLO.WORLD}}` should return { "parts": ["HELLO", "WORLD"] }
 */
export interface TemplateMacro {
  parts: string[]
}

/**
 * Basic interface for templating engines.
 *  `init()` should be called by the Plugin impl. in order to initialize the templating engine
 *  `compile()` should be called in order to generate a compiled version of the template that will be used to render the final HTML
 */
export interface TemplatingEngine<Opt, In, Out> {
  init: (opts?: Opt) => void;
  compile: (template: In) => Out;
}

/**
 * Allow the Plugin Impl. to look into the internals of the templating engine.
 */
export interface ExploreableInternalsTemplatingEngine<Opt, In, Out, Internals> extends TemplatingEngine<Opt, In, Out> {
  /**
   * Take the template and expose its internal representation of it
   */
  parse: (template: In) => Internals;
  /**
   * Can extract a list of macros from an internal representation of a template
   */
  getMacros: (internal: Internals) => TemplateMacro[];
  /**
   * Compile the template, either directly or with the Internals directly (for performance concerns: it's better to not do the parsing twice)
   */
  compile: (template: In | Internals) => Out;
}

/**
 * Allow the Plugin Impl. to provide some Profile Data to the Templating engine through a Provider function
 */
export interface ProfileDataTemplater {
  enableProfileDataLayer(): void
}