# BookSwap friends-only private-beta testing

Updated: 30 July 2026

## Access and safety

- Use only the direct HTTPS link sent privately by the owner. The canonical link is recorded after the deployment gate passes; do not share it publicly.
- Treat the site as test software. Use test listings and test messages where practical.
- Do not enter payment-card details, identity documents, private addresses, confidential messages, or other sensitive personal information.
- BookSwap does not process payments, hold funds, arrange delivery, or provide buyer protection. Do not send money as part of testing.

## Report a problem

Send the owner:

1. the page and action you were testing;
2. exact reproduction steps;
3. expected result and actual result;
4. screenshot or short screen recording, with private information hidden;
5. device, operating system, browser, and approximate time;
6. whether retrying, signing out/in, or changing network affected the problem.

Never include a password, login link, token, API key, private chat content, or another person's personal information in a report.

## Compact test matrix

| Flow                  | What to check                                                          | Expected result                                                         |
| --------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Account creation      | Create a test account and confirm email if requested                   | Generic, safe feedback; no disclosure about another account             |
| Login/logout/recovery | Sign in, sign out, use reset or magic-link flow if offered             | Correct redirect, session cleared on logout, safe Azerbaijani errors    |
| Profile               | Load and edit only your own profile                                    | Saved values return accurately; another account is never exposed        |
| Listing create        | Create a test book with minimal required information                   | One submission, clear success, listing belongs to the signed-in seller  |
| Images                | Upload JPEG, PNG, or WebP; replace one image                           | Preview and saved image agree; invalid/oversized files fail clearly     |
| Listing edit/delete   | Edit, mark sold/relist, then delete your own test listing              | Ownership enforced; repeated clicks do not duplicate the action         |
| Search/filter         | Search Azerbaijani text and combine filters/sorting                    | Results and empty states match the selected controls                    |
| Favorites             | Save and remove another tester's active listing                        | State persists only for your account                                    |
| Chat/contact          | Buyer messages a seller about a test listing                           | Only buyer and seller see the room; unread state updates correctly      |
| Review/report         | Exercise an eligible test review and a test report                     | Eligibility/duplicate/self-action boundaries are explained and enforced |
| Privacy request       | Submit a clearly marked test access/correction request                 | No false success; duplicate active requests are handled safely          |
| Mobile use            | Repeat discovery, menu, listing, image, and chat on a phone            | No horizontal overflow; keyboard and controls remain usable             |
| Errors                | Try invalid text, unsupported image, stale page, and signed-out action | Useful Azerbaijani recovery state; no raw provider or database detail   |

## Highest-risk sequence

Test these first with two separate friend accounts:

1. seller creates a listing with an image;
2. buyer finds it through search, favorites it, and opens chat;
3. seller and buyer exchange test messages and observe unread state;
4. buyer attempts to edit or delete the seller's listing and must be denied;
5. seller replaces the image, marks the listing sold, relists it, and deletes it;
6. both users sign out and confirm private pages no longer reveal account data.

The owner should stop testing and preserve the timestamp/reproduction details if any cross-account data appears, a destructive action affects the wrong account, an upload can overwrite another user's object, or a private message is visible to a third account.
