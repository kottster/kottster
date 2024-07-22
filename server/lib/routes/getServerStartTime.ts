import { Request, Response } from 'express';

// Get the time when the server started
const startTime = Date.now();

export const getServerStartTime = () => (req: Request, res: Response) => {
  res.send(startTime?.toString() || '0');
};
