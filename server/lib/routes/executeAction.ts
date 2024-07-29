import { Request, Response } from 'express';
import { ActionService } from '../services/action.service';
import { KottsterApp } from '../core/app';

/**
 * Execute a specific action
 */
export const executeAction = (app: KottsterApp) => async (req: Request, res: Response) => {
  const { action } = req.params as { action: string; };
  
  // Parse action data
  const rawData = req.query.actionData;
  let data = {};
  if (rawData) {
    try {
      data = JSON.parse(rawData.toString());
    } catch (error) {
      res.status(400).json({ error: 'Invalid data' });
      return;
    }
  }

  try {
    // Process the request based on the action and data
    const result = await ActionService.getAction(app, action).execute(data);
    
    res.json({ result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
    return;
  }
}
