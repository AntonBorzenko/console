import {Chart} from 'chart.js';
(<any>window).Chart = Chart;
import 'chartjs-plugin-streaming';

export interface ChartInfo {
    label?: string,
    prometheusQuery: string,
    runId?: string,
    scale?: number,
}

export interface PrometheusChartOptions {
    delay?: number,
    additionalChartDelay?: number,
    discretizationTime?: number,
    prometheusUrl?: string,
    totalDuration?: number,
    label?: string,
    realtime?: boolean,
    startTime?: number,
}

function assert(value: any, message?: string) {
    if (!value) {
        throw new Error(message || "Assertion is not passed");
    }
}

function httpGet(url): Promise<string> {
    return new Promise( (resolve, reject) => {
        let xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = function() {
            if (xmlHttp.readyState == 4) {
                if (xmlHttp.status < 300) {
                    resolve(xmlHttp.responseText);
                }
                else {
                    reject();
                }
            }
        };
        xmlHttp.open("GET", url, true); // true for asynchronous
        xmlHttp.send(null);
    } );
}

export class PrometheusChart {
    public options: PrometheusChartOptions;
    public charts: Array<ChartInfo>;
    public container: HTMLElement;
    public apiUrl: String;
    public chartController: Chart;

    constructor(container: HTMLElement, charts: Array<ChartInfo>, options: PrometheusChartOptions={}) {
        assert(container, 'DOM Element cannot be nullable');
        assert(Array.isArray(charts) && charts.length > 0, 'charts must contain at least 1 value');

        let defaultSettings: PrometheusChartOptions = {
            delay: 3000,
            additionalChartDelay: 0,
            discretizationTime: 500,
            prometheusUrl: 'http://localhost:9090',
            totalDuration: 20000,
            realtime: true,
        };

        options = Object.assign(defaultSettings, options);
        options.startTime = Date.now() - options.totalDuration - options.delay - options.additionalChartDelay;

        this.container = container;
        this.options = options;
        this.charts = charts;
        this.apiUrl = PrometheusChart.getApiUrl(options.prometheusUrl);

        this.start();
    }


    private chartColors: Array<string> = [
        'rgb(255, 99, 132)',
        'rgb(255, 159, 64)',
        'rgb(255, 205, 86)',
        'rgb(75, 192, 192)',
        'rgb(54, 162, 235)',
        'rgb(153, 102, 255)',
        'rgb(201, 203, 207)'
    ];
    private nextColor = 0;
    private getNewColor() {
        if (this.nextColor >= this.chartColors.length) {
            this.nextColor = 0;
        }

        // return this.chartColors[this.nextColor++];
        return this.chartColors[ Math.floor(Math.random() * this.chartColors.length ) ];
    }

    private start(): void {
        let chartJsOptions = {
            type: 'line',
            data: {
                datasets: this.charts.map( chart => {
                    return {
                        data : [],
                        label: chart.label || chart.prometheusQuery,
                        borderColor: this.getNewColor()
                    };
                } )
            },
            options: {
                scales: {
                    xAxes: []
                }
            }
        };

        if (this.options.realtime) {
            chartJsOptions.options.scales.xAxes.push({
                type: 'realtime',
                realtime : {
                    duration: this.options.totalDuration,
                    delay: this.options.delay + this.options.additionalChartDelay,
                    pause: false,
                    ttl: undefined,
                    onRefresh: function() {}
                }
            });
        }

        if (this.options.label) {
            chartJsOptions.options['title'] = {
                display: true,
                text: this.options.label
            };
        }

        this.chartController = new Chart(this.container, chartJsOptions);

        this.requestData(
            this.options.startTime,
            this.options.startTime + this.options.totalDuration + this.options.discretizationTime
        ).then( results => {
            this.appendResults(results);

            if (this.options.realtime) {
                this.startIterate();
            }
        } );
    }

    private previousTime = -1;
    private async requestData(startTime: number, endTime: number): Promise<Array<Array<Array<number>>>> {
        let start = startTime / 1000;
        let end = endTime / 1000;
        let step = this.options.discretizationTime / 1000;

        this.previousTime = endTime;

        let prometheusResults: Array<string> = await Promise.all(this.charts.map( chart => {
            let url = `${this.apiUrl}/query_range?query=${chart.prometheusQuery}&start=${start}&end=${end}&step=${step}`;
            return httpGet(url);
        } ));

        return prometheusResults.map( (result: any, index) => {
            if (typeof result === 'string') {
                result = JSON.parse(result);
            }

            if (!result || !result.data || !result.data.result) {
                throw new Error('Wrong type of object');
            }

            let dataObject;
            if (this.charts[index].runId) {
                dataObject = result.data.filter( dataObject => {
                    return dataObject.metric.run_id == this.charts[index].runId;
                } )[0];
            }
            else {
                dataObject = result.data.result[0];
            }

            if (!dataObject) {
                throw new Error('Filtered data is empty');
            }

            return dataObject.values;
        } );

    }

    private static getApiUrl(prometheusUrl: String): String {
        if (prometheusUrl[prometheusUrl.length - 1] !== '/') {
            prometheusUrl = prometheusUrl + '/';
        }
        prometheusUrl = prometheusUrl + 'api/v1';

        return prometheusUrl;
    }

    private appendResults(results: Array<Array<Array<number>>>) {
        assert( Array.isArray(results) && this.charts.length === results.length );

        console.log(results);

        this.chartController.data.datasets.forEach( (dataset, index) => {
            let result: Array<Array<number>> = results[index];
            result.forEach( pt => {
                dataset.data.push({
                    x: pt[0] * 1000,
                    y: pt[1] * (this.charts[index].scale || 1)
                });
            } );
        } );

        this.chartController.update({
            preservation: true
        });
    }

    private startIterate() {
        setInterval( () => {
            this.requestData(
                this.previousTime + this.options.discretizationTime,
                this.previousTime + this.options.totalDuration
            )
            .then( results => {
                this.appendResults(results);
            } );
        }, this.options.delay );
    }
}