import { Presentacion } from "./Presentacion";

export class CentroCosto {
    public id : number;
    public code : string;
    public planta : string;
    public proceso : string;
    public area : string;
    public planta_name : string;
    public proceso_name : string;
    public area_name : string;
    
    public presentacion : Array<Presentacion>;
}