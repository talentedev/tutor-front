import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'priceString'
})
export class PriceStringPipe implements PipeTransform {

  transform(priceString: string): string {
    const priceArray = priceString.split('-');
    return '$' + priceArray[0] + ' - ' +  '$' + priceArray[1];
  }

}
