import { Request, Response } from 'express';
import { KottsterApp } from '../core/app';

export const healthcheck = (app: KottsterApp) => async (req: Request, res: Response) => {
  const procedures = app.getProcedures();
  const dataSources = app.getDataSources();
  
  res.json({
    appId: app.appId,
    procedures: procedures.map(p => p.procedureName),
    dataSources: dataSources.map(ds => ds.contextPropName),
  });
}