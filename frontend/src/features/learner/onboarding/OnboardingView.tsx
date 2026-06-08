import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import { apiRequest } from "../../../shared/api";
import type { StudentProfileRequest } from "../../../shared/models";
import { OnboardingWizard } from "./OnboardingWizard";

export function OnboardingView() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  async function saveProfile(request: StudentProfileRequest) {
    await apiRequest("/personalization/me/profile", {
      method: "PUT",
      token: accessToken,
      body: request
    });
    navigate("/learner", { replace: true });
  }

  return (
    <OnboardingWizard
      eyebrow="Hồ sơ học"
      title="Cập nhật cá nhân hóa"
      description="Khi trình độ, mục tiêu hoặc thói quen học thay đổi, cập nhật hồ sơ để VAJA điều chỉnh trợ lý, thẻ nhớ, kiểm tra và lộ trình."
      completeLabel="Lưu thay đổi"
      onComplete={saveProfile}
    />
  );
}
