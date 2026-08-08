import { useConnection, useNotifications } from '../hooks/useConnection';
import {
  MySupportCard,
  NeedsAttentionCard,
  NextConnectionCard,
  deriveAttentionItems,
} from './ConnectionCards';

/**
 * Today's connection strip: Needs Attention, My Support, Next Connection.
 * Deliberately quiet — if connection state can't load, Today's recovery
 * content still renders (an optional card failing never blanks the page),
 * and nothing here turns the home screen into a status dashboard.
 */
export function TodayConnection() {
  const { state } = useConnection();
  const { unread } = useNotifications(1);

  if (!state) return null;

  const attention = deriveAttentionItems(state, unread);

  return (
    <div className="mt-5 flex flex-col gap-5">
      <NeedsAttentionCard items={attention} />
      <MySupportCard state={state} />
      <NextConnectionCard state={state} />
    </div>
  );
}
