import SuccessModal from "./SuccessModal";

export default function LogoutSuccessModal({ onDone }) {
  return <SuccessModal message="已成功登出" onDone={onDone} />;
}
