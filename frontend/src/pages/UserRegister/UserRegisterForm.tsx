/**
** =======================================================
@SECTION : User Management — Registration Form
@FILE    : UserRegisterForm.tsx
@PURPOSE : Formulário de cadastro de usuário (frontend) com validação,
           UX de erros e POST para o backend.
@LAST_EDIT : 2025-10-27
** =======================================================
*/

import React, { useEffect, useMemo, useState } from "react";
import {
  Form,
  Header,
  Title,
  Subtitle,
  Grid,
  Field,
  Label,
  Input,
  FieldError,
  Actions,
  Button,
} from "./Styled";

/**
 * Representa os campos do formulário de cadastro.
 * Usado como `state` controlado e também nas validações.
 */
type FormValues = {
  /** Nome completo do usuário (ex.: "Maria Bianchi") */
  fullName: string;
  /** Cargo do usuário (ex.: "Process Engineer") */
  jobTitle: string;
  /** E-mail corporativo (validado por regex) */
  companyEmail: string;
  /** Telefone de contato (mín. 10 dígitos) */
  contactNumber: string;
  /** Nível de usuário (ex.: "admin" | "user") */
  userLevel: string;
  /** Senha do usuário (mín. 8 caracteres) */
  password: string;
  /** Confirmação de senha; deve coincidir com `password` */
  confirmPassword: string;
};

/**
 * Expressão regular para validação simples de e-mail.
 * 
 */
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

/**
 * Endpoint (exemplo) de criação de usuários.
 * Observação: o componente, no POST, usa a string literal "http://localhost:3000/users".
 */
const USERS_URL = "http://localhost:3000/users"; // se houver prefixo, use "http://localhost:3000/api/users"

/**
 * Verifica se a senha é "forte" o suficiente segundo a regra mínima local.
 * @param pwd - senha informada pelo usuário
 * @returns `true` se o comprimento for >= 8 
 */
function isStrongPassword(pwd: string) {
  return pwd.trim().length >= 8;
}

/**
 * Componente de formulário de cadastro de usuário.
 *
 * ### Principais responsabilidades
 * - Controlar `state` dos campos
 * - Validação dos valores antes do submit
 * - Exibir feedback de erros por campo e erro geral de formulário
 * - Enviar POST ao backend com os dados já sanitizados
 *
 * ### Acessibilidade
 * - Campos com `aria-invalid` e `aria-describedby` quando há erro
 * - Mensagem de erro geral com `role="alert"`
 */
const UserRegisterForm: React.FC = () => {
  /** Estado dos campos do formulário (controlado) */
  const [values, setValues] = useState<FormValues>({
    fullName: "",
    jobTitle: "",
    companyEmail: "",
    contactNumber: "",
    userLevel: "",
    password: "",
    confirmPassword: "",
  });

  /**
   * Mapa de erros por campo.
   * - `Partial` + `Record` para manter tipagem segura por chave do formulário
   */
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormValues, string>>
  >({});

  /** Erro geral do formulário (falhas de rede ou mensagens do servidor) */
  const [formError, setFormError] = useState<string | null>(null);

  /** Indica operação de `submit` em progresso para bloquear UI/duplo clique */
  const [submitting, setSubmitting] = useState(false);

  /**
   * "Intent" de envio do formulário: quando setado, dispara o efeito de POST.
   * - Armazena os dados sanitizados (sem `confirmPassword`).
   */
  const [submitIntent, setSubmitIntent] = useState<null | Omit<
    FormValues,
    "confirmPassword"
  >>(null);

  const isLoading = useMemo(() => submitting, [submitting]);

  /**
   * Handler genérico para `onChange` de inputs controlados.
   * - Atualiza valor do campo
   * - Limpa erro do campo
   * - Limpa erro geral
   * @param field - chave do campo em `FormValues`
   */
  const handleChange =
    (field: keyof FormValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues((prev) => ({ ...prev, [field]: e.target.value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
      setFormError(null);
    };

  /**
   * Regras de validação do formulário (sincrônicas).
   * - Mantém o objeto de erros leve e específico por campo
   * @param v - valores atuais do formulário
   * @returns Mapa parcial de erros por campo
   */
  const validate = (v: FormValues) => {
    const next: Partial<Record<keyof FormValues, string>> = {};

    if (!v.fullName.trim()) next.fullName = "Enter your full name.";
    else if (v.fullName.trim().split(" ").length < 2)
      next.fullName = "Use first and last name.";

    if (!v.jobTitle.trim()) next.jobTitle = "Enter the position.";

    if (!v.companyEmail.trim())
      next.companyEmail = "Enter your corporate email.";
    else if (!emailRegex.test(v.companyEmail))
      next.companyEmail = "Invalid email.";

    if (!v.contactNumber.trim()) next.contactNumber = "Provide the phone number.";
    else if (v.contactNumber.replace(/\D/g, "").length < 10)
      next.contactNumber = "Incomplete phone number.";

    if (!v.userLevel.trim()) next.userLevel = "Enter the user level.";

    if (!v.password.trim()) next.password = "Enter the password.";
    else if (!isStrongPassword(v.password))
      next.password = "Minimum of 8 characters.";

    if (!v.confirmPassword.trim()) next.confirmPassword = "Confirm the password.";
    else if (v.password !== v.confirmPassword)
      next.confirmPassword = "The passwords do not match.";

    return next;
  };

  /**
   * Intercepta o submit do formulário:
   * - Executa validação
   * - Quando válido, prepara os dados sanitizados em `submitIntent`
   * - O POST em si é feito pelo `useEffect` que observa `submitIntent`
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitIntent({
      fullName: values.fullName.trim(),
      jobTitle: values.jobTitle.trim(),
      companyEmail: values.companyEmail.toLowerCase().trim(),
      contactNumber: values.contactNumber.trim(),
      userLevel: values.userLevel.trim(),
      password: values.password,
    });
  };

  /**
   * Efeito responsável por enviar o POST quando `submitIntent` é definido.
   * - Garante cancelamento seguro se o componente desmontar durante a requisição
   * - Mapeia status HTTP do backend para UX de erros amigável
   */
  useEffect(() => {
    if (!submitIntent) return;
    let cancelled = false;

    (async () => {
      try {
        setSubmitting(true);
        setFormError(null);

        const res = await fetch("http://localhost:3000/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submitIntent),
        });

        // Tenta decodificar JSON; em caso de falha, volta objeto vazio
        const data = await res.json().catch(() => ({}));

        if (cancelled) return;

        if (res.status === 201) {
          // sucesso: limpa formulário e erros
          setValues({
            fullName: "",
            jobTitle: "",
            companyEmail: "",
            contactNumber: "",
            userLevel: "",
            password: "",
            confirmPassword: "",
          });
          setErrors({});
          setFormError(null);
          return;
        }

        if (res.status === 409) {
          setErrors((prev) => ({
            ...prev,
            companyEmail: data?.error || "Email already registered.",
          }));
          return;
        }

        if (res.status === 400) {
          const msg = String(data?.error || "Validation error.");
          if (/password/i.test(msg))
            setErrors((p) => ({ ...p, password: msg }));
          else if (/email/i.test(msg))
            setErrors((p) => ({ ...p, companyEmail: msg }));
          else setFormError(msg);
          return;
        }

        if (res.status === 503) {
          setFormError(
            "Service temporarily unavailable. Please try again shortly.."
          );
          return;
        }

        // Fallback genérico
        setFormError(
          data?.error ||
            "Registration could not be completed. Please try again.."
        );
      } catch {
        if (!cancelled)
          setFormError(
            "Network failure. Check your connection and try again."
          );
      } finally {
        if (!cancelled) {
          setSubmitting(false);
          setSubmitIntent(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [submitIntent]);

  return (
    <Form onSubmit={handleSubmit} noValidate>
      <Header>
        <Title>User Registration</Title>
        <Subtitle>
          Fill in the information below to create a new user.
        </Subtitle>
      </Header>

      <Grid>
        <Field>
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            type="text"
            placeholder="Ex.: Maria Bianchi"
            value={values.fullName}
            onChange={handleChange("fullName")}
            aria-invalid={!!errors.fullName}
            aria-describedby={errors.fullName ? "err-fullName" : undefined}
          />
          {errors.fullName && (
            <FieldError id="err-fullName">{errors.fullName}</FieldError>
          )}
        </Field>

        <Field>
          <Label htmlFor="jobTitle">Job Title</Label>
          <Input
            id="jobTitle"
            type="text"
            placeholder="Ex.: Process Engineer"
            value={values.jobTitle}
            onChange={handleChange("jobTitle")}
            aria-invalid={!!errors.jobTitle}
            aria-describedby={errors.jobTitle ? "err-jobTitle" : undefined}
          />
          {errors.jobTitle && (
            <FieldError id="err-jobTitle">{errors.jobTitle}</FieldError>
          )}
        </Field>

        <Field>
          <Label htmlFor="companyEmail">Company Email</Label>
          <Input
            id="companyEmail"
            type="email"
            placeholder="name@company.com"
            value={values.companyEmail}
            onChange={handleChange("companyEmail")}
            aria-invalid={!!errors.companyEmail}
            aria-describedby={
              errors.companyEmail ? "err-companyEmail" : undefined
            }
          />
          {errors.companyEmail && (
            <FieldError id="err-companyEmail">{errors.companyEmail}</FieldError>
          )}
        </Field>

        <Field>
          <Label htmlFor="contactNumber">Contact Number</Label>
          <Input
            id="contactNumber"
            type="tel"
            inputMode="tel"
            placeholder="Ex.: +55 11 91234-5678"
            value={values.contactNumber}
            onChange={handleChange("contactNumber")}
            aria-invalid={!!errors.contactNumber}
            aria-describedby={
              errors.contactNumber ? "err-contactNumber" : undefined
            }
          />
          {errors.contactNumber && (
            <FieldError id="err-contactNumber">
              {errors.contactNumber}
            </FieldError>
          )}
        </Field>

        <Field>
          <Label htmlFor="userLevel">User Level</Label>
          <Input
            id="userLevel"
            type="text"
            placeholder="Ex.: admin ou user"
            value={values.userLevel}
            onChange={handleChange("userLevel")}
            aria-invalid={!!errors.userLevel}
            aria-describedby={errors.userLevel ? "err-userLevel" : undefined}
          />
          {errors.userLevel && (
            <FieldError id="err-userLevel">{errors.userLevel}</FieldError>
          )}
        </Field>

        <Field>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Mínimo 8 caracteres"
            value={values.password}
            onChange={handleChange("password")}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "err-password" : undefined}
          />
          {errors.password && (
            <FieldError id="err-password">{errors.password}</FieldError>
          )}
        </Field>

        <Field>
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Repita a senha"
            value={values.confirmPassword}
            onChange={handleChange("confirmPassword")}
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={
              errors.confirmPassword ? "err-confirmPassword" : undefined
            }
          />
          {errors.confirmPassword && (
            <FieldError id="err-confirmPassword">
              {errors.confirmPassword}
            </FieldError>
          )}
        </Field>
      </Grid>

      {formError && (
        <div role="alert" style={{ marginTop: "0.75rem" }}>
          <FieldError>{formError}</FieldError>
        </div>
      )}

      <Actions>
        <Button type="submit" disabled={isLoading} aria-busy={isLoading}>
          {isLoading ? "Saving... : Registerr"}
        </Button>
      </Actions>
    </Form>
  );
};

export default UserRegisterForm;
