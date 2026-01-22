/**
 * Inngest Client Configuration
 */

import { Inngest } from 'inngest';

export const inngest = new Inngest({
  id: 'wecraft',
  name: 'Wecraft Background Jobs',
  eventKey: process.env.INNGEST_EVENT_KEY,
});
