import { cookies } from "next/headers";
import {
  canAutoApproveSubmissions,
  MODERATOR_SESSION_COOKIE,
  parseModeratorSession,
} from "@/lib/auth";
import { submitSighting } from "./actions";
import { SubmitForm } from "./submit-form";

export default async function SubmitPage() {
  const cookieStore = await cookies();
  const moderatorSession = parseModeratorSession(
    cookieStore.get(MODERATOR_SESSION_COOKIE)?.value,
  );
  const canAutoApprove = canAutoApproveSubmissions(moderatorSession);

  return (
    <main className="wr-page-shell py-10">
      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="overflow-hidden rounded-2xl border border-amber-500/35 bg-[#9a3412] text-[#fef3c7]">
          <div className="p-8">
            <div className="text-4xl leading-none sm:text-5xl">
              <span aria-hidden>🐀</span>
            </div>
            <h1 className="wr-display mt-4 text-4xl font-bold tracking-tight">
              Submit a rat sighting
            </h1>
            <p className="mt-5 leading-relaxed text-amber-50/82">
              Add the movie, scene time, estimated rat count, and a short
              description of what appears on screen. You can attach up to five
              images to help moderators review your submission.
            </p>
          </div>
        </div>

        <div className="wr-card p-6 sm:p-7">
          <SubmitForm
            submitAction={submitSighting}
            canAutoApprove={canAutoApprove}
            moderatorName={moderatorSession?.name}
            loggedInName={moderatorSession?.name}
            loggedInEmail={moderatorSession?.email}
          />
        </div>
      </section>
    </main>
  );
}
