export class Chronos {
    private _name?: string | null;
    private _start: boolean;
    private _startTime?: Date | null;
    private accumulator: Date;
    private work: number;
  
    constructor(work: number, name: string | null = null, start: boolean = true) {
      this._name = name;
      this._start = start;
      this.accumulator = new Date(0);
      this.work = work;
      this.reset();
  
      if (this._start) {
        this.start();
      }
    }
  
    start(): void {
      this._startTime = new Date();
    }
  
    stop(): void {
      this._startTime = null;
    }
  
    update(): void {
      if (this._startTime) {
        this.accumulator = new Date(this.accumulator.getTime() + (new Date().getTime() - this._startTime.getTime()));
        this.start();
      }
    }
  
    reset(): void {
      this.accumulator = new Date(0);
      this._startTime = null;
    }
  
    setInitial(initial: string | undefined): void {
      try {
        if (initial) {
          const parsed = initial.split(':');
          const seconds = parsed[2].split('.');
          if (seconds.length > 1) {
            this.accumulator = new Date(0, 0, 0, parseInt(parsed[0]), parseInt(parsed[1]), parseInt(seconds[0]), parseInt(seconds[1]));
          } else {
            this.accumulator = new Date(0, 0, 0, parseInt(parsed[0]), parseInt(parsed[1]), parseInt(seconds[0]));
          }
        } else {
          console.error('timer... Initial value is undefined.');
        }
      } catch (ex) {
        console.error('timer...', ex);
      }
    }
    
    elapsed(): Date {
      if (this._startTime) {
        this.update();
      }
      return this.accumulator;
    }
  
    time(): string {
      return this.elapsed().toTimeString().split(' ')[0];
    }
  }
  
  // Example Usage
  const chronos = new Chronos(123);
  chronos.start();
  console.log(chronos.time());
  // Do some work
  chronos.update();
  console.log(chronos.time());
  
  export class Config {
    ws_server: string;
    api_server: string;
    vol_alert_on: number;
    min_wflow: number;
    max_wflow: number;
    unit_pressure: number;
    min_pressure: number;
    max_pressure: number;

    constructor(ws_server: string, api_server: string, vol_alert_on: number, min_wflow: number, max_wflow: number, unit_pressure: number, min_pressure: number, max_pressure: number) {
        this.ws_server = ws_server;
        this.api_server = api_server;
        this.vol_alert_on = vol_alert_on;
        this.min_wflow = min_wflow;
        this.max_wflow = max_wflow;
        this.unit_pressure = unit_pressure;
        this.min_pressure = min_pressure;
        this.max_pressure = max_pressure;
    }
}
