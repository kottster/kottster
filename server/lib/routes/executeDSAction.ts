import { Request, Response } from 'express';
import { ActionService } from '../services/action.service';
import { DevSync } from '../core/devSync';

/**
 * Execute a specific dev-sync action
 */
export const executeDSAction = (ds: DevSync) => async (req: Request, res: Response) => {
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
    const result = await ActionService.getDSAction(ds, action).execute(data);
    
    res.json({ result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
    return;
  }
}
