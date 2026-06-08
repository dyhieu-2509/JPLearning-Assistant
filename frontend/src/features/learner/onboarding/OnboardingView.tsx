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
      eyebrow="Thiết lập học tập"
      title="Thiết lập cá nhân hóa ban đầu"
      description="VAJA cần vài tín hiệu học tập để chọn độ khó, cách giải thích và lộ trình ôn tập phù hợp ngay từ buổi đầu."
      completeLabel="Lưu hồ sơ"
      onComplete={saveProfile}
    />
  );
}
