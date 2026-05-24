import { useState } from "react";

const faqs = [
    {
        q: "Why was my gate access denied?",
        a: "Gate access may be denied if your plate is not registered, your profile is inactive, there is a plate mismatch, or your membership has expired. Contact support if you believe this is an error.",
    },
    {
        q: "How long does it take to approve my profile changes?",
        a: "Standard requests are reviewed within 24–48 hours. Vehicle-related changes may take 2–3 days. You will receive a notification once processed.",
    },
    {
        q: "How can I view my gate access history?",
        a: "Your complete gate access history is in the Gate Logs section, including timestamps, plate images, and authorization status.",
    },
    {
        q: "What should I do about unauthorized access attempts?",
        a: "Review the timestamp and captured image, then contact security immediately if it was not your vehicle.",
    },
    {
        q: "How do I update my vehicle information?",
        a: "Go to My Profile, update the vehicle section, submit your changes, and wait for admin approval.",
    },
];

const ResidentHelpPage = () => {
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    return (
        <div className="flex h-full w-full flex-1 flex-col gap-4">
            <div className="mb-2">
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Help & Support</h1>
                <p className="mt-1 text-zinc-600 dark:text-zinc-400">Get help and contact the subdivision security office</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                    <h2 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-zinc-100">Contact Us</h2>

                    <ContactCard
                        title="Live Chat"
                        description="Chat with security office staff during business hours"
                        actionLabel="Start Chat"
                        onAction={() => alert("Chat feature will be implemented soon!")}
                        actionClass="bg-blue-600 hover:bg-blue-700"
                    />
                    <ContactCard
                        title="Call Us"
                        description="Available 24/7 for emergencies"
                        detail="+1 (555) 123-4567"
                        actionLabel="Call Now"
                        onAction={() => { window.location.href = "tel:+15551234567"; }}
                        actionClass="bg-green-600 hover:bg-green-700"
                    />
                    <ContactCard
                        title="Email Support"
                        description="Send us an email for detailed inquiries"
                        detail="security@subdivision.com"
                        actionLabel="Send Email"
                        onAction={() => { window.location.href = "mailto:security@subdivision.com"; }}
                        actionClass="bg-purple-600 hover:bg-purple-700"
                    />
                </div>

                <div>
                    <h2 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-zinc-100">Frequently Asked Questions</h2>
                    <div className="space-y-3">
                        {faqs.map((faq, index) => (
                            <div key={faq.q} className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
                                <button
                                    type="button"
                                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                                    className="flex w-full items-center justify-between px-6 py-4 text-left transition hover:bg-zinc-50 dark:hover:bg-zinc-700"
                                >
                                    <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">{faq.q}</h4>
                                    <span className="text-2xl text-zinc-400">{openFaq === index ? "−" : "+"}</span>
                                </button>
                                {openFaq === index && (
                                    <div className="border-t border-zinc-200 px-6 pb-4 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
                                        <p className="pt-3">{faq.a}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
                <h2 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-zinc-100">Troubleshooting Guide</h2>
                <div className="grid gap-6 md:grid-cols-2">
                    <TroubleBlock title="Can't login to my account" items={["Verify email and password", "Use Forgot Password to reset", "Clear browser cache", "Contact support if issue persists"]} />
                    <TroubleBlock title="Not receiving notifications" items={["Check notification settings", "Ensure email is verified", "Check spam folder", "Refresh the page"]} />
                    <TroubleBlock title="Profile update rejected" items={["Check the rejection reason", "Verify required fields", "Ensure plate format is correct", "Resubmit with corrections"]} />
                    <TroubleBlock title="Gate access slow or not working" items={["Check internet connection", "Ensure plate is visible", "Verify registration in system", "Report to security for manual verification"]} />
                </div>
            </div>

            <div className="rounded-lg border-l-4 border-red-500 bg-red-50 p-6 dark:bg-red-900/20">
                <h3 className="mb-2 text-lg font-bold text-red-900 dark:text-red-200">Emergency?</h3>
                <p className="mb-3 text-red-800 dark:text-red-300">For security emergencies, call immediately:</p>
                <p className="mb-3 font-mono text-2xl font-bold text-red-700 dark:text-red-400">911 or +1 (555) 999-9999</p>
                <p className="text-sm text-red-800 dark:text-red-300">Available 24/7 for urgent security matters</p>
            </div>
        </div>
    );
};

const ContactCard = ({
    title, description, detail, actionLabel, onAction, actionClass,
}: {
    title: string;
    description: string;
    detail?: string;
    actionLabel: string;
    onAction: () => void;
    actionClass: string;
}) => (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 transition hover:shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
        <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
        {detail && <p className="mb-3 font-mono text-sm text-blue-600 dark:text-blue-400">{detail}</p>}
        <button type="button" onClick={onAction} className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition ${actionClass}`}>
            {actionLabel}
        </button>
    </div>
);

const TroubleBlock = ({ title, items }: { title: string; items: string[] }) => (
    <div>
        <h3 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
        <ul className="list-inside list-disc space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
            {items.map((item) => <li key={item}>{item}</li>)}
        </ul>
    </div>
);

export default ResidentHelpPage;
