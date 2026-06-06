const links = {
  linkedin: "https://www.linkedin.com/in/sankalp212/",
  github: "https://github.com/sankalpshukla7474-creator",
  portfolio: "https://sankalpshukla7474-creator.github.io/Sankalp_Portfolio/"
};

export function recruiterAnswer(query: string) {
  const text = query.toLowerCase();

  if (hasAny(text, ["portfolio", "website", "site", "linkedin", "github link", "profile link"])) {
    return [
      "Verified links:",
      `- Portfolio: ${links.portfolio}`,
      `- GitHub: ${links.github}`,
      `- LinkedIn: ${links.linkedin}`
    ].join("\n");
  }

  if (hasAny(text, ["where do", "where he work", "where does", "current role", "experience", "internship"])) {
    return [
      "Sankalp's verified experience:",
      "- Junior AI Engineer Intern at Globe Spring Solutions: LLM pipelines, RAG, LangChain/LangGraph, n8n automation.",
      "- Machine Learning Engineer Intern at Globe Spring Solutions: ML pipelines, FastAPI workflows, MLflow tracking.",
      "- Freelance AI & Automation Engineer: RAG systems, custom AI agents, and n8n workflows."
    ].join("\n");
  }

  if (hasAny(text, ["skill", "tech stack", "technology", "technologies"])) {
    return [
      "Sankalp's core skills:",
      "- LLM/RAG: LangChain, LangGraph, Llama 3, GPT, BERT, Pinecone, Chroma.",
      "- Agentic AI: LangGraph workflows, tool/function calling, RAG orchestration, and n8n automation.",
      "- Backend/automation: FastAPI, Flask, REST webhooks, Docker, AWS, Vercel."
    ].join("\n");
  }

  if (hasAny(text, ["github", "git hub", "git", "repo", "repositories", "repository"])) {
    return [
      "Best repositories to review:",
      `- AI Resume Builder: LLM + n8n workflow that tailors resumes and generates PDFs. ${links.github}/resume_builder`,
      `- LangChain Healthcare AI: FastAPI/React AI triage assistant using Gemini. ${links.github}/langchain-healthcare-ai`,
      `- AI-Powered Judiciary: legal RAG and hallucination-verification system. ${links.github}/AI-Powered-Judiciary`
    ].join("\n");
  }

  if (hasAny(text, ["project", "agent", "automation", "built"])) {
    return [
      "Relevant AI projects:",
      "- AI Resume Builder: JD parsing, resume tailoring, PDF generation, Google Drive logging, and n8n orchestration.",
      "- Judicial RAG System: precedent retrieval, trust scoring, hallucination detection, FastAPI/Docker/AWS deployment.",
      "- Healthcare AI Chatbot: multi-turn AI assistant with FastAPI/React deployment and Gemini integration."
    ].join("\n");
  }

  if (hasAny(text, ["fit", "why", "strong", "role", "hire"])) {
    return [
      "Sankalp is a strong fit for an AI engineering role because:",
      "- He has hands-on LLM/RAG experience with LangChain, LangGraph, Llama, Pinecone, and evaluation metrics.",
      "- He has built deployed AI products, not only notebooks: resume automation, legal RAG, healthcare AI, and anomaly detection.",
      "- He also understands integrations: FastAPI, n8n, REST webhooks, Docker, AWS, and Vercel."
    ].join("\n");
  }

  return null;
}

function hasAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}
