/* Md3Consent — "As on nucleux.in" from the Nucleux catalog (@nucleux/react 0.12.0), kept as published. */
import { MsBlock, MsSchedule, MsVisibility } from "@nucleux/md3-icons";
import { Md3Consent, type ConsentScopeItem } from "@nucleux/md3-consent";

/** The Google Drive logo, in its brand colours. */
const GoogleDrive = () => (
  <svg viewBox="0 0 87.3 78" aria-hidden="true" focusable="false">
    <path
      fill="#0066da"
      d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z"
    />
    <path
      fill="#00ac47"
      d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z"
    />
    <path
      fill="#ea4335"
      d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z"
    />
    <path
      fill="#00832d"
      d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z"
    />
    <path
      fill="#2684fc"
      d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z"
    />
    <path
      fill="#ffba00"
      d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z"
    />
  </svg>
);

const TITLE = "Allow Aria to use Google Drive?";
const WHY =
  "The product brief is in Google Drive. Aria needs to read it to compare it with this meeting.";
const SCOPE: ConsentScopeItem[] = [
  { icon: <MsVisibility />, label: "Read files and folders your account can open" },
  { icon: <MsBlock />, label: "Can’t edit, share or delete anything" },
  { icon: <MsSchedule />, label: "For this conversation only" },
];
const OUTCOME = (
  <>
    <b>If you continue:</b> Google Drive asks you to confirm your account, then Aria reads only the
    files this request needs.
  </>
);
const DETAILS = (
  <dl className="m-0 flex flex-col gap-2">
    <div>
      <dt className="font-semibold">Account</dt>
      <dd className="m-0">j.rivera@northwind.example</dd>
    </div>
    <div>
      <dt className="font-semibold">Activity</dt>
      <dd className="m-0">Every file Aria opens is listed in the conversation.</dd>
    </div>
    <div>
      <dt className="font-semibold">Turn it off</dt>
      <dd className="m-0">Settings › Connected apps, at any time.</dd>
    </div>
  </dl>
);

/** Work paused at the one step Aria may not take without permission: what, why, the scope and what happens next. */
export function SitePreview() {
  return (
    <Md3Consent
      className="w-[35rem] max-w-full"
      icon={<GoogleDrive />}
      badge="Access request"
      title={TITLE}
      description={WHY}
      scope={SCOPE}
      scopeLabel="What Aria will be able to do"
      outcome={OUTCOME}
      details={DETAILS}
      denyLabel="Not now"
      allowLabel="Continue"
      onDeny={() => {}}
      onAllow={() => {}}
    />
  );
}
