import { Request, Response } from 'express';
import { KottsterApp } from '../core/app';

export const executeProcedure = (app: KottsterApp) => async (req: Request, res: Response) => {
  const { procedureName } = req.params as { procedureName: string };
  const args = req.query;

  try {
    const procedures = app.getProcedures();
    const procedure = procedures.find(p => p.procedureName === procedureName);
    
    if (!procedure) {
      res.status(400).json({ error: `Procedure ${procedureName} not found` });
      return;
    }

    const ctx = app.createContext();
    const procedureFunction = procedure.function as Function;
    const result = await procedureFunction({ ctx, args });
    
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: e.message });
  }
}
