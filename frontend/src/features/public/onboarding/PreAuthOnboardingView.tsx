import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import type { StudentProfileRequest } from "../../../shared/models";
import { saveOnboardingDraft } from "../../../shared/onboardingDraft";
import { OnboardingWizard } from "../../learner/onboarding/OnboardingWizard";

export function PreAuthOnboardingView() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate replace to="/learner/onboarding" />;
  }

  async function saveDraft(request: StudentProfileRequest) {
    saveOnboardingDraft(request);
    navigate("/login?mode=register&onboarding=1", { replace: true });
  }

  return (
    <div className="public-onboarding-screen">
      <OnboardingWizard
        eyebrow="Người học mới"
        title="Trả lời 8 câu trước khi đăng nhập"
        description="Các lựa chọn này được lưu tạm trên trình duyệt. Sau khi đăng nhập hoặc tạo tài khoản, VAJA sẽ đưa chúng vào góc học của bạn."
        completeLabel="Tiếp tục đăng nhập"
        onComplete={saveDraft}
      />
    </div>
  );
}
