import { Component, OnInit, ViewChild } from "@angular/core";
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexTitleSubtitle,
  ApexDataLabels,
  ApexFill,
  ApexMarkers,
  ApexYAxis,
  ApexXAxis,
  ApexTooltip,
  ApexNoData,
} from "ng-apexcharts";
import { Backend } from "../../lib/core/auth";
import * as moment from "moment";
export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart; //ApexChart;
  dataLabels: ApexDataLabels;
  markers: ApexMarkers;
  title: ApexTitleSubtitle;
  fill: ApexFill;
  yaxis: ApexYAxis;
  xaxis: ApexXAxis;
  tooltip: ApexTooltip;
  noData: ApexNoData;
  colors: any[];
};

@Component({
  selector: "learnt-admin-metrics",
  templateUrl: "./admin-metrics.component.html",
  styleUrls: ["./admin-metrics.component.scss"],
})
export class AdminMetricsComponent implements OnInit {
  selected: { startDate: moment.Moment; endDate: moment.Moment };
  selectedHourly: { startDate: moment.Moment; endDate: moment.Moment };
  inlineDate: any;
  inlineDateTime: any;
  private max: any;
  private min: any;
  public tabIndex = -1;
  public chart1options: Partial<ChartOptions>;
  public chart2options: Partial<ChartOptions>;
  public commonOptions: Partial<ChartOptions> = {
    dataLabels: {
      enabled: false,
    },
    colors: ["#F37073"],
    markers: {
      size: 0,
    },
    tooltip: {
      shared: false,
      y: {
        formatter: function (val) {
          return val.toFixed(0);
        },
      },
    },
    fill: {
      colors: ["#F37073"],
      type: "gradient",
      gradient: {
        gradientToColors: ["#F37073", "#FFFFFF"],
        shadeIntensity: 1,
        inverseColors: false,
        opacityFrom: 1,
        opacityTo: 0,
        stops: [0, 95, 100],
      },
    },
    yaxis: {
      labels: {
        formatter: function (val) {
          return val.toFixed(0);
        },
      },
    },
  };
  constructor(private backend: Backend) {
    this.initCharts();
    this.getLessonMetric();
    this.getHourlyLessonMetric();
  }

  ngOnInit() {
    
  }

  public initCharts(): void {
    this.chart1options = {
      title: {
        text: "Daily Sessions",
      },
      series: [
        {
          name: "Daily",
          data: [],
        },
      ],
      chart: {
        type: "area",
        height: 350,
        stacked: false,
        zoom: {
          type: "x",
          enabled: true,
          autoScaleYaxis: true,
        },
        toolbar: {
          autoSelected: "zoom",
        },
      },
      xaxis: {
        type: "datetime",
        labels: {
          formatter: function (val) {
            return moment(new Date(val)).format("MMM/DD");
          },
        },
      },
    };

    this.chart2options = {
      title: {
        text: "Hourly Sessions",
      },
      series: [
        {
          name: "Hourly",
          data: [],
        },
      ],
      chart: {
        type: "area",
        height: 350,
        stacked: false,
        zoom: {
          type: "x",
          enabled: true,
          autoScaleYaxis: true,
        },
      },
      xaxis: {
        type: "datetime",
        tickAmount: 10,
        labels: {
          formatter: function (val) {
            return moment(new Date(val)).format("MMM/DD HH:00");
          },
        },
      },
    };
  }

  lessonMetric(event) {
    this.getLessonMetric();
  }

  instantLessonMetric(event) {
    this.getInstantLessonMetric();
  }

  hourlyLessonMetric(event) {
    this.getHourlyLessonMetric();
  }

  hourlyInstantLessonMetric(event) {
    this.getHourlyInstantLessonMetric();
  }

  getLessonMetric() {
    let title = "Sessions";
    this.chart1options.title = {
      text: title,
    };
    this.chart1options.series = [
      {
        name: title,
        data: [],
      },
    ];
    this.backend.getSessionsMetric().subscribe(
      (res) => {
        this.chart1options.series = [
          {
            name: title,
            data: res.data,
          },
        ];
        // if empty, noData would kick in
        if (res.data.length > 0) {
          this.selected = {
            startDate: moment(res.data[0].x),
            endDate: moment(res.data[res.data.length - 1].x),
          };
          this.chart1options.xaxis = {
            type: "datetime",
            min: this.selected.startDate.toDate().getTime(),
            max: this.selected.endDate.toDate().getTime(),
          };
        }
      },
      (err) => {
        console.log(err);
      }
    );
  }

  getHourlyLessonMetric() {
    let title = "Sessions";
    this.chart2options.title = {
      text: title,
    };
    this.chart2options.series = [
      {
        name: title,
        data: [],
      },
    ];
    this.backend.getHourlySessionsMetric().subscribe(
      (res) => {
        this.chart2options.series = [
          {
            name: title,
            data: res.data,
          },
        ];
        if (res.data.length > 0) {
          this.min = moment(res.data[0].x);
          this.max = moment(res.data[res.data.length - 1].x);
          this.selectedHourly = {
            startDate: this.min,
            endDate: this.max,
          };
          this.chart2options.xaxis = {
            type: "datetime",
            min: this.min.toDate().getTime(),
            max: this.max.toDate().getTime(),
          };
        }
      },
      (err) => {
        console.log(err);
      }
    );
    this.tabIndex = -1;
  }

  getInstantLessonMetric() {
    let title = "Instant Sessions";
    this.chart1options.title = {
      text: title,
    };
    this.chart1options.series = [
      {
        name: title,
        data: [],
      },
    ];
    this.backend.getInstantSessionsMetric().subscribe(
      (res) => {
        this.chart1options.series = [
          {
            name: title,
            data: res.data,
          },
        ];
        if (res.data.length > 0) {
          this.selected = {
            startDate: moment(res.data[0].x),
            endDate: moment(res.data[res.data.length - 1].x),
          };
          this.chart1options.xaxis = {
            type: "datetime",
            min: this.selected.startDate.toDate().getTime(),
            max: this.selected.endDate.toDate().getTime(),
          };
        }
      },
      (err) => {
        console.log(err);
      }
    );
  }

  getHourlyInstantLessonMetric() {
    this.tabIndex = -1;
    let title = "Instant Sessions";
    this.chart2options.title = {
      text: title,
    };
    this.chart2options.series = [
      {
        name: title,
        data: [],
      },
    ];
    this.backend.getHourlyInstantSessionsMetric().subscribe(
      (res) => {
        this.chart2options.series = [
          {
            name: title,
            data: res.data,
          },
        ];
        if (res.data.length > 0) {
          this.min = moment(res.data[0].x);
          this.max = moment(res.data[res.data.length - 1].x);
          this.selectedHourly = {
            startDate: this.min,
            endDate: this.max,
          };
          this.chart2options.xaxis = {
            type: "datetime",
            min: this.min.toDate().getTime(),
            max: this.max.toDate().getTime(),
          };
        }
      },
      (err) => {
        console.log(err);
      }
    );
  }

  change(event) {
    if (event.startDate || event.endDate) {
      this.chart1options.xaxis = {
        type: "datetime",
        min: this.selected.startDate.toDate().getTime(),
        max: this.selected.endDate.toDate().getTime(),
      };
    }
  }

  changeHourly(event) {
    this.tabIndex = 0;
    if (event.startDate || event.endDate) {
      this.chart2options.xaxis = {
        type: "datetime",
        min: this.selectedHourly.startDate.toDate().getTime(),
        max: this.selectedHourly.endDate.toDate().getTime(),
      };
    }
  }

  onTabClick(index) {
    this.tabIndex = index;
    let min: moment.Moment;
    let max: moment.Moment;
    min = moment(Date.now() - index * 86400000);
    max = moment(Date.now());
    if (index == -1) {
      min = this.min;
      max = this.max;
    }

    this.selectedHourly = {
      startDate: min,
      endDate: max,
    };
    this.chart2options.xaxis = {
      type: "datetime",
      min: min.toDate().getTime(),
      max: max.toDate().getTime(),
    };
  }

  private generateDayWiseTimeSeries(baseval, count, yrange): any[] {
    let i = 0;
    let series = [];
    while (i < count) {
      let x = baseval;
      let y =
        Math.floor(Math.random() * (yrange.max - yrange.min + 1)) + yrange.min;
      series.push([x, y]);
      baseval += 86400000;
      i++;
    }
    return series;
  }
}
