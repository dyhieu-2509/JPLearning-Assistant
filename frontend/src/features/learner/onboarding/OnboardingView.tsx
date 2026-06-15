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
    return <LoadingPanel>Đang kiểm tra góc học của bạn...</LoadingPanel>;
  }

  if (!allowInitialPersonalization) {
    return <LoadingPanel>Đang chuyển sang bài kiểm tra nhanh...</LoadingPanel>;
  }

  return (
    <OnboardingWizard
      eyebrow="Bắt đầu"
      title="Làm quen với cách học của bạn"
      description="VAJA chỉ hỏi bước này khi bạn mới bắt đầu. Sau đó, bài thử và lịch sử ôn sẽ giúp kế hoạch học ngày càng vừa sức hơn."
      completeLabel="Vào góc học"
      onComplete={saveProfile}
    />
  );
}
