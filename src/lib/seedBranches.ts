import { getFirebaseDb } from "@/firebase"; 
import { collection, getDocs, doc, writeBatch } from "firebase/firestore";

export async function seedBranchesIfNeeded() {
  const db = getFirebaseDb();
  const branchesCollectionRef = collection(db, 'branches');

  const BRANCH_NAMES = [
    "Jos - Dutse Uku Branch",
    "Naraguta Branch",
    "Saminaka Branch",
    "Lere Branch",
    "Dokan Lere Branch",
    "Mariri Branch",
    "Katchia Branch",
    "Kayarda Branch",
    "Toro Branch",
    "Marwa Branch",
    "Nye Kogi State Branch",
    "Gambare Ogbomosho Branch",
    "Hamama Ogbomosho Branch",
    "Sakee Branch"
  ];

  const existingSnap = await getDocs(branchesCollectionRef);
  const existingNames = existingSnap.docs.map(doc => doc.data().name);

  const missingBranches = BRANCH_NAMES.filter(name => !existingNames.includes(name));

  if (missingBranches.length > 0) {
    const batch = writeBatch(db);

    missingBranches.forEach(name => {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const branchRef = doc(branchesCollectionRef, slug);
      batch.set(branchRef, {
        name,
        slug,
        address: name.replace(' Branch', '')
      });
    });

    await batch.commit();
    console.log("✅ Missing branches added automatically!");
  } else {
    console.log("✅ All branches already exist.");
  }
}
