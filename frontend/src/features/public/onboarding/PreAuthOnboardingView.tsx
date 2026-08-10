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
        description="Các lựa chọn này được lưu tạm trên trình duyệt. Nếu bạn bắt đầu từ số 0, bạn có thể tạo tài khoản mới ngay hoặc học thử 3 bài trước."
        completeLabel={(answers) => (answers.currentLevel === "ZERO" ? "Chọn cách bắt đầu" : "Tiếp tục tạo tài khoản")}
        onComplete={saveDraft}
      />
    </div>
  );
}
