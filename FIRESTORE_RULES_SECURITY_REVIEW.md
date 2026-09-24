# Firestore rules security review

Scope: `builderlink` Enterprise Native Firestore database, reviewed September 2, 2026.

## Application access patterns

- Authenticated users create and read only `profiles/{uid}` documents containing email and phone data.
- Authenticated users read verified `builders/{uid}` catalogue documents; builders manage their own documents.
- Administrative writes rely on an immutable `administrator` role in a protected profile.

## Adversarial checks

| Attempt | Expected result | Outcome |
| --- | --- | --- |
| Unauthenticated profile or catalogue read | Denied | Rules require `request.auth`. |
| Read another user's profile containing PII | Denied | Profile read requires the path UID to equal `request.auth.uid`. |
| Create a profile with another UID | Denied | Path ownership and `id == request.auth.uid` are both required. |
| Create or change an administrator role | Denied | Client creation permits only customer/builder; role is immutable on update. |
| Change profile email, role, ID, or creation time | Denied | Immutable-field validation blocks all four. |
| Add undefined or oversized profile/builder fields | Denied | Allow lists and string size checks validate writes. |
| Read unverified builder data | Denied | Catalogue read is limited to verified documents or the owner. |
| Change builder ownership, rating, completed jobs, or verification state | Denied | Immutable fields and allowed transition checks protect those fields. |
| Use builder-only collections without a builder document | Denied | `isBuilder()` requires the caller's builder document. |

The rules compile successfully in Firebase CLI dry-run. They still need live emulator/device tests covering each row above before a production launch.
