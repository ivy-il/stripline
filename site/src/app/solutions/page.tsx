import { redirect } from "next/navigation";

// Solutions now live on the home page, as in the client's design.
export default function SolutionsPage() {
  redirect("/#solutions");
}
