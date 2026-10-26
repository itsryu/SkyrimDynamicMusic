export const FormCancelationReason = { UserBusy: "UserBusy", UserClosed: "UserClosed" };

export class ModalFormData {
  title() {
    return this;
  }
  toggle() {
    return this;
  }
  slider() {
    return this;
  }
  dropdown() {
    return this;
  }
  show() {
    return Promise.resolve({ canceled: true });
  }
}
