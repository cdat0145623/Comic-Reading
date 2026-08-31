"use client";

import { useEffect, useState } from "react";
import FormUser from "./FormUser";
import SettingsNav from "./SettingsNav";
import LibrarySettingsForm from "./tu-truyen/LibrarySettingsForm";
import AccountSecurityPanel from "./AccountSecurityPanel";
import SecuritySettings from "./SecuritySettings";

function SettingsTabs({ account, initialSettings, userId }) {
    const [activeTab, setActiveTab] = useState("profile");
    const [focusEmailForm, setFocusEmailForm] = useState(false);
    const [pendingEmail, setPendingEmail] = useState(account.pendingEmail);

    useEffect(() => {
        setPendingEmail(account.pendingEmail);
    }, [account.pendingEmail]);

    function openSecurityTab() {
        setFocusEmailForm(true);
        setActiveTab("security");
    }

    return (
        <div>
            <SettingsNav activeTab={activeTab} onChange={setActiveTab} />

            <div role="tabpanel">
                {activeTab === "profile" ? (
                    <div>
                        <div className="app-border border-b px-5 py-5 sm:px-7">
                            <h1 className="text-xl font-semibold">Hồ sơ</h1>
                            <p className="app-muted mt-1 text-sm">
                                Quản lý thông tin hiển thị của tài khoản.
                            </p>
                        </div>
                        <FormUser />
                        <AccountSecurityPanel
                            {...account}
                            onOpenSecurity={openSecurityTab}
                        />
                    </div>
                ) : activeTab === "library" ? (
                    <LibrarySettingsForm
                        initialSettings={initialSettings}
                        userId={userId}
                    />
                ) : (
                    <SecuritySettings
                        account={account}
                        pendingEmail={pendingEmail}
                        onPendingEmailChange={setPendingEmail}
                        focusEmailForm={focusEmailForm}
                        onEmailFocused={() => setFocusEmailForm(false)}
                    />
                )}
            </div>
        </div>
    );
}

export default SettingsTabs;
