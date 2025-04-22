Lorsque je vous donne la commande "commit!", je souhaite que vous m'aidiez à organiser et créer des commits Git structurés. Suivez ces étapes précises:

1. DÉTECTION DU CONTEXTE GIT
   - Si je vous ai preciser precedemment de ne pas utiliser de ticket, ne tenez pas compte de cette étape
   - command suivi de no-ticket ou no ticket alors passer cette étape
   - Utilisez `git branch --show-current` ou un tool a votre disposition pour déterminer la branche actuelle
   - Extrayez le ticket correspondant depuis le nom de la branche
   - Le format du ticket est attendu comme suit: CARACTÈRES_MAJUSCULES-NOMBRE (exemple: JIRA-123)
   - Si le ticket ne peut pas être déterminé, demandez-moi de le préciser

2. VÉRIFICATION DES FICHIERS
   - vérifier s'il y a des fichiers à commiter (modifiés, non suivis, ou déjà stagés)
   - Si aucun fichier n'est à commiter, informez-moi clairement pourquoi la commande ne peut pas s'exécuter
   - Affichez le résultat de votre analyse pour confirmation

3. ANALYSE DES MODIFICATIONS
   - Examinez les fichiers modifiés
   - Groupez logiquement les fichiers par fonctionnalité ou composant
   - Établissez un ordre de commit basé sur les dépendances (les composants de base avant les fonctionnalités qui en dépendent)

4. PLAN DE COMMITS
   - Présentez un plan détaillé des commits que vous allez créer
   - Pour chaque commit prévu, indiquez:
     * Nom du commit (courte description)
     * Liste des fichiers concernés avec liens vers ces fichiers
     * Description des modifications apportées dans ces fichiers
     * Justification du regroupement de ces fichiers

5. DESCRIPTION GLOBALE DES MODIFICATIONS
   - Fournissez une description globale de l'ensemble des modifications apportées
   - Expliquez comment ces modifications s'intègrent dans le projet et leur impact potentiel

6. DESCRIPTION DETAILLÉE DES MODIFICATIONS
   - Pour chaque fichier modifié, fournissez une description détaillée des changements et expliquer ce qui a été fait
   - Indiquez les lignes de code ajoutées ou supprimées
   - Expliquez pourquoi ces changements sont nécessaires et comment ils améliorent le projet
   - Mentionnez les tickets ou tâches associés à ces modifications
   - Indiquez si des tests sont nécessaires après ces modifications
   - Si des tests sont nécessaires, précisez comment les tests doivent être effectués et quels outils utiliser

7. TEST COMMIT LINT NOT THROW ERROR
   - Vérifiez si le message de commit respecte les règles de linting configurées dans le projet
   - Si le message ne respecte pas les règles, indiquez-le et fournissez des suggestions pour le corriger
   - comment vérifier le message de commit: 
     {{include: ./test-commit-message-lint.prompt.md#L13, style: indent}}

8. CORRECT COMMIT MESSAGE
   - Si le message de commit respecte les règles, indiquez-le et fournissez le message de commit final
   - Si le message ne respecte pas les règles, fournissez un message corrigé
   - Si d'autre choses sont à faire avant de commiter, indiquez-le et faite les modifications nécessaires

9. GÉNÉRATION DES COMMITS
   - Pour chaque groupe de fichiers, générez une commande Git complète incluant:
     * `git add` pour les fichiers spécifiques de ce groupe
     * `git commit` avec un message au format précis:
       ```
       fix/feat/chore/refactor(nomFonctionnalitéEnCamelCase): Description concise du changement TICKET-123
       ```
   - La commande doit être prête à être copiée-collée et exécutée
   - Les parenthèses sont utilisées uniquement pour le nom de la fonctionnalité, pas pour le ticket

10. COMMANDE DE REVERT
   - À la fin, fournissez une commande unique qui permettra d'annuler tous les commits créés
   - Expliquez comment cette commande fonctionnera
   - Format: `git reset --soft HEAD~X` (où X est le nombre de commits créés) ou une autre approche appropriée

FORMAT DES MESSAGES DE COMMIT:
- Préfixe: "fix" (pour corrections) ou "feat" (pour nouvelles fonctionnalités) ou "chore" (pour tâches d'entretien) ou "refactor" (pour refactorisation)
- Portée: (nomDeLaFonctionnalitéEnCamelCase)
- Description: courte description à l'impératif en sentence case
- Ticket: identifiant du ticket SANS parenthèses
- Exemple: "feat(userAuthentication): Add password reset functionality JIRA-456"

EXEMPLES DE BONS MESSAGES:
- "fix(dataExport): Resolve CSV encoding issue PROJ-123"
- "feat(userInterface): Implement dark mode toggle UI-789"
- "refactor(apiClient): Improve error handling API-456"
- "chore(dependencies): Update React to version 17.0.2 DEP-123"