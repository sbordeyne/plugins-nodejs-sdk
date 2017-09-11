import { AdRendererBaseInstanceContext } from "./InstanceContextInterface";

export interface TemplatingEngine<Opt, In, Out> {

    init: (opts?: Opt) => void;
    compile: (template: In) => Out;

}