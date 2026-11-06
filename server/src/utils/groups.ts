import Group, { type GroupDocument } from '../models/Group';
import type { Types } from 'mongoose';

/** The group only if the user is one of its members (the owner included). */
export function resolveMemberGroup(
  groupId: string,
  userId: Types.ObjectId
): Promise<GroupDocument | null> {
  return Group.findOne({ _id: groupId, 'members.user': userId });
}

export interface SettleRow {
  id: string;
  name: string;
  net: number;
}

export interface SettleTransfer {
  from: { id: string; name: string };
  to: { id: string; name: string };
  amount: number;
}

/**
 * Suggests the fewest transfers that square the books: greedily match the
 * biggest creditor against the biggest debtor until all nets are ~zero.
 */
export function planSettlement(rows: SettleRow[]): SettleTransfer[] {
  const EPSILON = 0.005; // ignore sub-cent dust
  const creditors = rows.filter((row) => row.net > EPSILON).sort((a, b) => b.net - a.net);
  const debtors = rows.filter((row) => row.net < -EPSILON).sort((a, b) => a.net - b.net);

  const transfers: SettleTransfer[] = [];
  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const credit = creditors[ci];
    const debt = debtors[di];
    const amount = Math.min(credit.net, -debt.net);

    credit.net -= amount;
    debt.net += amount;

    if (amount > EPSILON) {
      transfers.push({
        from: { id: debt.id, name: debt.name },
        to: { id: credit.id, name: credit.name },
        amount: Math.round(amount * 100) / 100,
      });
    }
    if (credit.net <= EPSILON) ci += 1;
    if (debt.net >= -EPSILON) di += 1;
  }

  return transfers;
}
