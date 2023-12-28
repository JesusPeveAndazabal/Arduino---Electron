export class Chronos {
  private _name: string | null;
  private _start: boolean;
  private _startTime!: Date | null;
  private accumulator!: number;
  private work: number;

  constructor(work: number, name: string | null = null, start: boolean = true) {
    this._name = name;
    this._start = start; // Boolean start clock on instantiation
    this.work = work;
    this.reset();
    if (this._start) {
      this.start();
    }
  }

  start(): void {
    /** Start or restart the timer */
    this._startTime = new Date();
  }

  stop(): void {
    /** Stop the timer */
    this._startTime = null;
  }

  update(): void {
    /** Update the clock accumulator */
    if (this._startTime) {
      this.accumulator += new Date().getTime() - this._startTime.getTime();
    }
    this.start();
  }

  reset(): void {
    /**
       * This is a method that resets the timer by setting the accumulator to zero
       * and the start time to None. This is useful for when you want to start timing
       * something from scratch.
       */
    this.accumulator = 0;
    this._startTime = null;
  }

  set_initial(initial: string): void {
    /**
     * This is a method that sets the initial value of the accumulator based on a
     * str input. The input is parsed to extract the hours, minutes, seconds, and
     * milliseconds values, which are then used to create a datetime.timedelta object
     * that is assigned to the accumulator attribute. If the input does not include
     * milliseconds, the default value of zero is used instead.
     */
    try {
      const parsed = initial.split(':');
      const seconds = parsed[2].split('.');
      if (seconds.length > 1) {
        this.accumulator =
          +parsed[0] * 3600000 + +parsed[1] * 60000 + +seconds[0] * 1000 + +seconds[1];
      } else {
        this.accumulator = +parsed[0] * 3600000 + +parsed[1] * 60000 + +seconds[0] * 1000;
      }
    } catch (ex) {
      console.log('timer...', ex);
    }
  }

  elapsed(): number {
    /**
     * If the clock has a start time, add the difference between now and the
     * start time to the accumulator and return the accumulation. If the clock
     * does not have a start time, return the accumulation.
     */
    if (this._startTime) {
      this.update();
    }
    return this.accumulator;
  }

  time(): string {
    /**
     * This function returns the elapsed time as a string in the format HH:mm:ss.SSS.
     * It's used to measure the amount of time it takes for a certain process or function to complete.
     * The elapsed time may be useful for debugging or optimization purposes.
     */
    const elapsedMilliseconds = this.elapsed();
    const hours = Math.floor(elapsedMilliseconds / 3600000);
    const minutes = Math.floor((elapsedMilliseconds % 3600000) / 60000);
    const seconds = Math.floor((elapsedMilliseconds % 60000) / 1000);
    const milliseconds = elapsedMilliseconds % 1000;

    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${milliseconds}`;
  }
}

  
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
