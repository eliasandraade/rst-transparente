import { beforeAll, describe, expect, it } from "vitest";

const ORG_A = "8f282e77-cb75-4d75-99fd-9ac01057227c";
const ORG_B = "11111111-2222-4333-8444-555555555555";

let files: typeof import("./files");

beforeAll(async () => {
  // Assinatura local, sem rede: só precisa de uma configuração (de teste).
  Object.assign(process.env, { CLOUDINARY_CLOUD_NAME: "nuvem-teste", CLOUDINARY_API_KEY: "123", CLOUDINARY_API_SECRET: "segredo-teste" });
  files = await import("./files");
});

describe("anexos privados", () => {
  const ref = `cond-file:image:jpg:orken-cond/${ORG_A}/demandas/1700000000000-foto`;

  it("referência só vale na pasta da própria organização", () => {
    expect(files.parseAttachmentRef(ref, ORG_A)).toEqual({ resourceType: "image", format: "jpg", publicId: `orken-cond/${ORG_A}/demandas/1700000000000-foto` });
    expect(files.parseAttachmentRef(ref, ORG_B)).toBeNull();
    expect(files.parseAttachmentRef("https://res.cloudinary.com/x/image/upload/a.jpg", ORG_A)).toBeNull();
    expect(files.parseAttachmentRef(`cond-file:image:jpg:orken-cond/${ORG_A}/demandas/../pareceres/x`, ORG_A)).toBeNull();
  });

  it("vira link assinado que expira; URL antiga https segue; o resto some", () => {
    const now = Date.UTC(2026, 10, 3, 12, 0, 0);
    const link = new URL(files.attachmentLink(ref, ORG_A, now)!);
    expect(link.hostname).toBe("api.cloudinary.com");
    expect(link.searchParams.get("type")).toBe("authenticated");
    expect(Number(link.searchParams.get("expires_at"))).toBe(now / 1000 + 600);
    expect(link.searchParams.get("signature")).toBeTruthy();
    expect(files.attachmentLink(ref, ORG_B, now)).toBeNull();
    expect(files.attachmentLink("https://res.cloudinary.com/x/raw/upload/antigo.pdf", ORG_A)).toBe("https://res.cloudinary.com/x/raw/upload/antigo.pdf");
    expect(files.attachmentLink("javascript:alert(1)", ORG_A)).toBeNull();
    expect(files.attachmentLink(null, ORG_A)).toBeNull();
  });
});
