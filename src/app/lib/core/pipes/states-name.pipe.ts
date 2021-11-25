import { Pipe, PipeTransform } from "@angular/core";
import { stateCodeToName } from "../../helpers/states";


@Pipe({
    name: "statesName"
})
export class StatesNamePipe implements PipeTransform {

    transform(stateCode: string): string {
        return stateCodeToName(stateCode) || stateCode;
    }
}
