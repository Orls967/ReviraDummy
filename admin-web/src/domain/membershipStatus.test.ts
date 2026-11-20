import { membershipStatusMeta, normalizeMembershipStatus } from './membershipStatus';

describe('normalizeMembershipStatus', () => {
  it.each([
    ['active', 'active'],
    [' Pending ', 'pending'],
    ['UPCOMING', 'upcoming'],
    ['expired', 'expired'],
    ['none', 'none'],
  ])('mengenali %s', (input, expected) => {
    expect(normalizeMembershipStatus(input)).toBe(expected);
  });

  it.each([['rejected'], ['aktif'], [''], [null], [undefined], [42]])('menganggap %s sebagai none', (input) => {
    expect(normalizeMembershipStatus(input)).toBe('none');
  });

  it('memberi label bahasa Indonesia', () => {
    expect(membershipStatusMeta('active')).toEqual({ label: 'Aktif', tone: 'success' });
    expect(membershipStatusMeta('pending').label).toBe('Menunggu verifikasi');
    expect(membershipStatusMeta('anything').label).toBe('Belum ada');
  });
});
