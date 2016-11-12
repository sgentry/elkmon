import * as messages from './messages';
import { responseTypes } from './types';


/**
 * Creates an Elk Response based on the type of message passed in.
 * 
 * @export
 * @param {string} message
 * @returns
 */
export default function getElkResponse(response: string) {
  const type = response.substring(2, 4);
  const messageType = responseTypes.get(type);

  if (messages[messageType]) {
    // Create message instance based on the type of message received.
    const ElkMessage = messages[messageType];
    return new ElkMessage(response);
  } else {
    // Message not supported yet. Just return base Elk message.
    return new messages.ElkMessage(null, response);
  }
}