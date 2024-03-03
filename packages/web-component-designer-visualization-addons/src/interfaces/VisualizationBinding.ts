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
    expression?: string; // could also be blockly ora complete javascript
    expressionTwoWay?: string;
    compiledExpression?: Function;
    compiledExpressionTwoWay?: Function;
    type?: string;
    historic?: { reloadInterval?: number };

    maybeLitElement?: boolean, 
    litEventNames?: string[]
}