/**
 * Policy texts shown in the app. These are drafts written to match what the app
 * actually does: have them reviewed against the Malawi Data Protection Act 2024
 * before launch, and bump LEGAL_UPDATED whenever the wording changes.
 */

// TODO: replace with the real support inbox before release.
export const SUPPORT_EMAIL = 'support@builderlink.mw';
export const LEGAL_UPDATED = '23 November 2026';

export type LegalSection = { heading: string; body: string[] };
export type LegalDoc = { title: string; summary: string; sections: LegalSection[] };

export const LEGAL_DOCS = {
  privacy: {
    title: 'Privacy Policy',
    summary: 'What we collect, why we collect it and the choices you have.',
    sections: [
      {
        heading: 'Who we are',
        body: [
          'BuilderLink Malawi connects customers with builders, artisans and other construction professionals. We are responsible for the personal data you give us through the app.',
        ],
      },
      {
        heading: 'What we collect',
        body: [
          'Account details: your name, email address or phone number, and the role you sign up as (customer or professional). If you sign in with Google we receive your name and email from Google.',
          'Profile details: your district, phone number, profile photo and, for professionals, your trade, experience, rates and portfolio photos.',
          'Verification documents: professionals upload an identity document so we can check who they are. These are kept separately from public profile photos and are only seen by our review team.',
          'Activity: bookings, messages and photos you send in chat, reviews you write, and professionals you save.',
          'Device data: a push-notification token so we can tell you about new messages and booking updates.',
        ],
      },
      {
        heading: 'How we use it',
        body: [
          'To run your account, show your profile to the people you deal with, deliver messages and booking updates, verify professionals, keep the platform safe from fraud and abuse, and answer your support requests.',
          'We do not sell your personal data and we do not use it for third-party advertising.',
        ],
      },
      {
        heading: 'Who can see it',
        body: [
          'A verified professional’s name, photo, trade, district, portfolio, rating and reviews are public in the app. Phone numbers and email addresses are only shared with someone you have a booking with.',
          'Messages and chat photos are only visible to the people in that conversation.',
        ],
      },
      {
        heading: 'Service providers',
        body: [
          'We use Google Firebase for sign-in, our database and push notifications, and Cloudinary to store photos and documents. They process data on our behalf, under contract, and may store it on servers outside Malawi.',
        ],
      },
      {
        heading: 'How long we keep it',
        body: [
          'We keep your data while your account is open. When you close your account we delete or anonymise your profile, photos and documents within 30 days. Bookings and reviews may be kept in anonymised form, and we keep records longer only where the law requires it.',
        ],
      },
      {
        heading: 'Your rights',
        body: [
          'You can see and correct most of your details under Profile › Edit profile. You can also ask us for a copy of your data, ask us to correct or delete it, or object to how we use it, by emailing us at the address below.',
          'If you are unhappy with how we handle your data you can complain to the Malawi Communications Regulatory Authority (MACRA), the data protection authority in Malawi.',
        ],
      },
      {
        heading: 'Security',
        body: [
          'Data is sent over encrypted connections and access is limited by account. No system is perfectly secure, so please keep your password private and tell us straight away if you think your account has been misused.',
        ],
      },
      {
        heading: 'Children',
        body: ['BuilderLink is for people aged 18 and over. We do not knowingly collect data from children.'],
      },
    ],
  },

  terms: {
    title: 'Terms of Use',
    summary: 'The rules for using BuilderLink as a customer or a professional.',
    sections: [
      {
        heading: 'Using BuilderLink',
        body: [
          'By creating an account you agree to these terms. You must be 18 or older and give accurate information about yourself.',
          'You are responsible for everything done through your account, so keep your sign-in details safe.',
        ],
      },
      {
        heading: 'What we do and don’t do',
        body: [
          'BuilderLink is a marketplace. We help customers find professionals and arrange work, but we are not a party to the agreement between a customer and a professional and we do not employ the professionals listed.',
          'Verification confirms a professional’s identity. It is not a guarantee of the quality, safety or price of their work. Agree the scope, cost and timeline in writing before work starts.',
        ],
      },
      {
        heading: 'Bookings and payments',
        body: [
          'Prices, deposits and payment terms are agreed directly between the customer and the professional. Any dispute about the work should first be raised with the other party; you can also contact us and we will try to help.',
        ],
      },
      {
        heading: 'Professionals',
        body: [
          'Professionals must hold any licences or permits their work requires, describe their skills and rates honestly, and only post photos of work they actually did.',
        ],
      },
      {
        heading: 'Content you post',
        body: [
          'You keep ownership of the photos, reviews and messages you post. You give us permission to store and display them in the app so the service can work. Do not post anything you do not have the right to share.',
        ],
      },
      {
        heading: 'Suspension',
        body: [
          'We may remove content or suspend accounts that break these terms or our Community Guidelines, or that put other users at risk.',
        ],
      },
      {
        heading: 'Liability',
        body: [
          'The app is provided as it is. To the extent the law allows, we are not responsible for losses arising from work arranged between users. Nothing in these terms removes rights you have under Malawian consumer law.',
        ],
      },
      {
        heading: 'Changes and governing law',
        body: [
          'We may update these terms and will tell you in the app when we make important changes. These terms are governed by the laws of Malawi.',
        ],
      },
    ],
  },

  community: {
    title: 'Community Guidelines',
    summary: 'How we expect everyone on BuilderLink to behave.',
    sections: [
      {
        heading: 'Be respectful',
        body: ['No harassment, threats, hate speech or discrimination in messages, reviews or profiles.'],
      },
      {
        heading: 'Be honest',
        body: [
          'Use your real name and photo. Professionals: only show your own work and quote fairly. Customers: describe the job accurately.',
          'Reviews must be about a real booking. Do not post fake reviews or offer anything in return for one.',
        ],
      },
      {
        heading: 'Keep it safe',
        body: [
          'Do not ask for or share passwords, one-time codes or full bank details in chat. Be wary of anyone who pressures you to pay large amounts upfront.',
        ],
      },
      {
        heading: 'Report problems',
        body: ['If someone breaks these guidelines, email us with the person’s name and what happened. We review every report.'],
      },
    ],
  },

  verification: {
    title: 'Verification & Safety',
    summary: 'How we check professionals and how to stay safe when hiring.',
    sections: [
      {
        heading: 'How verification works',
        body: [
          'Professionals upload a government-issued ID. Our team checks that the ID is genuine and matches the profile before the professional appears in search.',
          'ID documents are stored privately, used only for verification and fraud prevention, and deleted when the account is closed.',
        ],
      },
      {
        heading: 'Hiring safely',
        body: [
          'Read reviews and look at portfolio photos before booking. Keep conversations and agreements in BuilderLink chat so there is a record. Pay in stages that match progress rather than everything upfront.',
        ],
      },
    ],
  },
} satisfies Record<string, LegalDoc>;

export type LegalDocKey = keyof typeof LEGAL_DOCS;
