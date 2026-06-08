import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import { apiRequest } from "../../../shared/api";
import { LoadingPanel } from "../../../shared/components";
import type { StudentProfileRequest, StudentProfileResponse } from "../../../shared/models";
import { needsLearnerOnboarding } from "../../../shared/profile";
import { OnboardingWizard } from "./OnboardingWizard";

export function OnboardingView() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [allowInitialPersonalization, setAllowInitialPersonalization] = useState(false);

  useEffect(() => {
    if (!accessToken) {
      setCheckingProfile(false);
      return;
    }

    let active = true;
    apiRequest<StudentProfileResponse>("/personalization/me/profile", { token: accessToken })
      .then((profile) => {
        if (!active) {
          return;
        }

        if (needsLearnerOnboarding(profile)) {
          setAllowInitialPersonalization(true);
        } else {
          navigate("/learner/assessment", { replace: true });
        }
      })
      .catch(() => {
        if (active) {
          setAllowInitialPersonalization(true);
        }
      })
      .finally(() => {
        if (active) {
          setCheckingProfile(false);
        }
      });

    return () => {
      active = false;
    };
  }, [accessToken, navigate]);

  async function saveProfile(request: StudentProfileRequest) {
    await apiRequest("/personalization/me/profile", {
      method: "PUT",
      token: accessToken,
      body: request
    });
    navigate("/learner", { replace: true });
  }

  if (checkingProfile) {
    return <LoadingPanel>Đang kiểm tra hồ sơ cá nhân hóa...</LoadingPanel>;
  }

  if (!allowInitialPersonalization) {
    return <LoadingPanel>Đang chuyển sang bài kiểm tra cá nhân hóa...</LoadingPanel>;
  }

  return (
    <OnboardingWizard
      eyebrow="Cá nhân hóa ban đầu"
      title="Hoàn tất hồ sơ học lần đầu"
      description="VAJA chỉ dùng bước này khi chưa có đủ tín hiệu ban đầu. Sau đó, cá nhân hóa lại sẽ dựa trên bài kiểm tra và lịch sử học."
      completeLabel="Lưu cá nhân hóa"
      onComplete={saveProfile}
    />
  );
}
