//Binding: haow to use...
//binding:display="{'signal':'aa',..."
//binding:value="aa" -> simplified form when only binding a direct property

import type { BindingTarget } from "@node-projects/web-component-designer";

export interface VisualizationBinding {
    interval?: number; //if triggered by interval
    signal: string;
    inverted?: boolean;
    twoWay?: boolean;
    events?: string[];
    target: BindingTarget;
    converter?: Record<string, any>;
    converterDefault?: any;
    expression?: string; // could also be blockly ora complete javascript
    expressionTwoWay?: string;
    compiledExpression?: Function;
    compiledExpressionTwoWay?: Function;
    type?: string;
    writeBackSignal?: string;
    historic?: { reloadInterval?: number, [nm: string]: any };

    maybeLitElement?: boolean,
    litEventNames?: string[]
}