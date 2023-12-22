import { CentroCosto } from "./CentroCosto";
import { TurnoPlanta } from "./TurnoPlanta";

export class ProgramacionTrabajo {
    public id : number;
    public centro_costo : CentroCosto;
    public user_id : number;
    public planta_id : number;
    public turno : TurnoPlanta;
}