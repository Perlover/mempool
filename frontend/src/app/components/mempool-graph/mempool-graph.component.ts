import { Component, OnInit, Input, Inject, LOCALE_ID, ChangeDetectionStrategy, OnChanges } from '@angular/core';
import { formatDate } from '@angular/common';
import { VbytesPipe } from 'src/app/pipes/bytes-pipe/vbytes.pipe';
import * as Chartist from 'chartist';
import { environment } from 'src/environments/environment';
import { OptimizedMempoolStats } from 'src/app/interfaces/node-api.interface';

@Component({
  selector: 'app-mempool-graph',
  templateUrl: './mempool-graph.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MempoolGraphComponent implements OnInit, OnChanges {
  @Input() data;

  network = environment.network;
  mempoolVsizeFeesOptions: any;
  mempoolVsizeFeesData: any;

  constructor(
    private vbytesPipe: VbytesPipe,
    @Inject(LOCALE_ID) private locale: string,
  ) { }

  ngOnInit(): void {
    const labelInterpolationFnc = (value: any, index: any) => {
      return index % 6  === 0 ? formatDate(value, 'HH:mm', this.locale) : null;
    };

    this.mempoolVsizeFeesOptions = {
      showArea: true,
      showLine: false,
      fullWidth: true,
      showPoint: false,
      low: 0,
      axisX: {
        labelInterpolationFnc: labelInterpolationFnc,
        offset: 40
      },
      axisY: {
        labelInterpolationFnc: (value: number): any => {
          return this.vbytesPipe.transform(value, 2);
        },
        offset: 160
      },
      plugins: [
        Chartist.plugins.ctTargetLine({
          value: 1000000
        }),
        Chartist.plugins.legend({
          legendNames: [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 30, 40, 50, 60, 70, 80, 90, 100, 125, 150, 175, 200,
            250, 300, 350, 400].map((sats, i, arr) => {
              if (sats === 400) {
               return '350+';
              }
              if (i === 0) {
                if (this.network === 'liquid') {
                  return '0 - 1';
                }
                return '1 sat/vB';
              }
              return arr[i - 1] + ' - ' + sats;
            })
        })
      ]
    };
  }

  ngOnChanges() {
    this.mempoolVsizeFeesData = this.handleNewMempoolData(this.data.concat([]));
  }

  handleNewMempoolData(mempoolStats: OptimizedMempoolStats[]) {
    mempoolStats.reverse();
    const labels = mempoolStats.map(stats => stats.added);

    const finalArrayVbyte = this.generateArray(mempoolStats);

    // Only Liquid has lower than 1 sat/vb transactions
    if (this.network !== 'liquid') {
      finalArrayVbyte.shift();
    }

    return {
      labels: labels,
      series: finalArrayVbyte
    };
  }

  generateArray(mempoolStats: OptimizedMempoolStats[]) {
    const finalArray: number[][] = [];
    let feesArray: number[] = [];

    for (let index = 37; index > -1; index--) {
      feesArray = [];
      mempoolStats.forEach((stats) => {
        const theFee = stats.vsizes[index].toString();
        if (theFee) {
          feesArray.push(parseInt(theFee, 10));
        } else {
          feesArray.push(0);
        }
      });
      if (finalArray.length) {
        feesArray = feesArray.map((value, i) => value + finalArray[finalArray.length - 1][i]);
      }
      finalArray.push(feesArray);
    }
    finalArray.reverse();
    return finalArray;
  }

}
