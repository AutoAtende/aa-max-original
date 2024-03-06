import * as Yup from "yup";

import AppError from "../../errors/AppError";
import Whatsapp from "../../models/Whatsapp";
import Company from "../../models/Company";
import Plan from "../../models/Plan";
import AssociateWhatsappQueue from "./AssociateWhatsappQueue";

interface Request {
  name: string;
  companyId: number;
  queueIds?: number[];
  greetingMessage?: string;
  complationMessage?: string;
  outOfHoursMessage?: string;
  ratingMessage?: string;
  status?: string;
  isDefault?: boolean;
  token?: string;
  provider?: string;
  sendIdQueue?: number;
  timeSendQueue?: number;
  promptId?: number;
  maxUseBotQueues?: number;
  timeUseBotQueues?: number;
  expiresTicket?: number;
  expiresInactiveMessage?: string;
}

interface Response {
  whatsapp: Whatsapp;
  oldDefaultWhatsapp: Whatsapp | null;
}

const CreateWhatsAppService = async ({
  name,
  status = "OPENING",
  queueIds = [],
  greetingMessage,
  complationMessage,
  outOfHoursMessage,
  ratingMessage,
  isDefault = false,
  companyId,
  token = "",
  provider = "beta",
  timeSendQueue,
  sendIdQueue,
  promptId,
  maxUseBotQueues = 3,
  timeUseBotQueues = 0,
  expiresTicket = 0,
  expiresInactiveMessage = ""
}: Request): Promise<Response> => {
  const company = await Company.findOne({
    where: {
      id: companyId
    },
    include: [{ model: Plan, as: "plan" }]
  });

  if (company !== null) {
    const whatsappCount = await Whatsapp.count({
      where: {
        companyId
      }
    });

    if (whatsappCount >= company.plan.connections) {
      throw new AppError(
        `Número máximo de conexões já alcançado: ${whatsappCount}`
      );
    }
  }

  const schema = Yup.object().shape({
    name: Yup.string()
      .required()
      .min(2)
      .test(
        "Check-name",
        "Esse nome já está sendo utilizado por outra conexão",
        async value => {
          if (!value) return false;
          const nameExists = await Whatsapp.findOne({
            where: { name: value }
          });
          return !nameExists;
        }
      ),
    isDefault: Yup.boolean().required()
  });

  try {
    await schema.validate({ name, status, isDefault });
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const whatsappFound = await Whatsapp.findOne({ where: { companyId } });

  isDefault = !whatsappFound;

  let oldDefaultWhatsapp: Whatsapp | null = null;

  if (isDefault) {
    oldDefaultWhatsapp = await Whatsapp.findOne({
      where: { isDefault: true, companyId }
    });
    if (oldDefaultWhatsapp) {
      await oldDefaultWhatsapp.update({ isDefault: false, companyId });
    }
  }

  if (queueIds.length > 1 && !greetingMessage) {
    throw new AppError("ERR_WAPP_GREETING_REQUIRED");
  }

  if (token !== null && token !== "") {
    const tokenSchema = Yup.object().shape({
      token: Yup.string()
        .required()
        .min(2)
        .test(
          "Check-token",
          "This whatsapp token is already used.",
          async value => {
            if (!value) return false;
            const tokenExists = await Whatsapp.findOne({
              where: { token: value }
            });
            return !tokenExists;
          }
        )
    });

    try {
      await tokenSchema.validate({ token });
    } catch (err: any) {
      throw new AppError(err.message);
    }
  }

  const whatsapp = await Whatsapp.create(
    {
      name,
      status,
      greetingMessage,
      complationMessage,
      outOfHoursMessage,
      ratingMessage,
      isDefault,
      companyId,
      token,
      provider,
      timeSendQueue,
      sendIdQueue,
      promptId,
      maxUseBotQueues,
      timeUseBotQueues,
      expiresTicket,
      expiresInactiveMessage
    },
    { include: ["queues"] }
  );

  await AssociateWhatsappQueue(whatsapp, queueIds);

  return { whatsapp, oldDefaultWhatsapp };
};

export default CreateWhatsAppService;
