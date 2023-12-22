export interface WorkExecution{
    id : number;
    work : number;
    lot : number;
    worker : number;
    supervisor :number;
    date: moment.Moment;
    configuration : string;
    working_time : moment.Moment;
    downtime : moment.Moment;
    hectare : number;
    cultivation : number;
    product : number;
    is_finished : number;
    farm : number;
    sended: number;
    min_volume : number;
}

export interface WaterVolumes{
    id : number;
    work_exec_id : number;
    volume : number;
}