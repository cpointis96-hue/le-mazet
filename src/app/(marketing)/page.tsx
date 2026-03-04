import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { ArrowRight, CalendarDays, Users, Shield, Zap, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function LandingPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return (
        <div className="flex flex-col items-center w-full">

            {/* HERO SECTION */}
            <section className="relative w-full pt-8 pb-10 md:pt-12 md:pb-16 overflow-hidden flex flex-col items-center text-center px-4 sm:px-6 lg:px-8">
                {/* Background Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl aspect-[1/1] bg-primary/20 blur-[120px] rounded-full opacity-50 pointer-events-none" />

                <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">

                    <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-slate-900 dark:text-white mb-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                        Notre <br className="hidden sm:inline" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-500 to-violet-500">
                            Calendrier.
                        </span>
                    </h1>

                    <p className="text-lg sm:text-xl md:text-2xl text-slate-600 dark:text-slate-300 max-w-2xl mb-8 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                        Un espace privé pour nous organiser facilement. Vois quand les autres sont dispos, ajoute tes dispos, et on se capte !
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
                        {user ? (
                            <Button size="lg" asChild className="h-14 px-8 text-lg rounded-full font-bold shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90 border-0">
                                <Link href="/calendrier">
                                    Accéder au calendrier <ArrowRight className="ml-2 w-5 h-5" />
                                </Link>
                            </Button>
                        ) : (
                            <>
                                <Button size="lg" asChild className="h-14 px-8 text-lg rounded-full font-bold shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90 border-0">
                                    <Link href="/inscription">Rejoindre le groupe</Link>
                                </Button>
                                <Button size="lg" variant="outline" asChild className="h-14 px-8 text-lg rounded-full font-semibold border-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                    <Link href="/connexion">Se connecter</Link>
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* Dashboard Preview Image */}
                <div className="relative z-10 w-full max-w-6xl mt-8 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
                    <div className="rounded-2xl md:rounded-[2.5rem] p-2 md:p-4 bg-white/5 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-xl shadow-2xl overflow-hidden ring-1 ring-inset ring-white/10">
                        <img
                            src="/hero-group.jpg"
                            alt="Aperçu du groupe CalenShare"
                            className="w-full h-auto max-h-[60vh] object-cover object-top rounded-xl md:rounded-[2rem] shadow-sm opacity-90 hover:opacity-100 transition-opacity"
                        />
                    </div>
                </div>
            </section>

            {/* FEATURES SECTION */}
            <section id="features" className="w-full py-24 bg-white dark:bg-slate-900 relative">
                <div className="container mx-auto px-6 lg:px-8 max-w-7xl">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">Tout ce dont vous avez besoin pour vous organiser.</h2>
                        <p className="text-lg text-muted-foreground">Oubliez la complexité. CalenShare va à l'essentiel avec des outils puissants mais simples à utiliser.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Users className="w-6 h-6 text-blue-500" />}
                            title="Calendrier Commun Global"
                            description="Visualisez les disponibilités et les événements publics de tous les utilisateurs sur une seule et même grille."
                        />
                        <FeatureCard
                            icon={<Shield className="w-6 h-6 text-emerald-500" />}
                            title="Confidentialité absolue"
                            description="Gardez vos rendez-vous privés invisibles, ou choisissez de n'afficher que le statut « occupé » sans les détails."
                        />
                        <FeatureCard
                            icon={<CalendarDays className="w-6 h-6 text-amber-500" />}
                            title="Gestion personnelle"
                            description="Un espace dédié pour gérer vos propres rappels, vos tâches et vos événements récurrents."
                        />
                        <FeatureCard
                            icon={<Zap className="w-6 h-6 text-purple-500" />}
                            title="Synchro temps réel"
                            description="Créer un événement s'affiche instantanément sur les écrans de vos proches. Aucune actualisation nécessaire."
                        />
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS SECTION */}
            <section id="how-it-works" className="w-full py-24 bg-slate-50 dark:bg-slate-950">
                <div className="container mx-auto px-6 lg:px-8 max-w-5xl text-center">
                    <h2 className="text-3xl md:text-5xl font-bold mb-16">Comment ça marche ?</h2>

                    <div className="grid md:grid-cols-3 gap-12 text-left relative">
                        {/* Ligne connectrice (desktop) */}
                        <div className="hidden md:block absolute top-[28px] left-[16%] right-[16%] h-0.5 bg-border z-0" />

                        <StepCard
                            number="1"
                            title="Créez votre profil"
                            description="Inscrivez-vous en quelques clics et personnalisez votre avatar et votre couleur."
                        />
                        <StepCard
                            number="2"
                            title="Ajoutez vos événements"
                            description="Remplissez votre calendrier avec vos rendez-vous, vacances ou soirées."
                        />
                        <StepCard
                            number="3"
                            title="Découvrez le monde"
                            description="Basculez sur le calendrier commun pour voir ce que font les autres et trouver des créneaux libres."
                        />
                    </div>
                </div>
            </section>

            {/* CTA FINAL */}
            <section className="w-full py-24 relative overflow-hidden bg-primary text-primary-foreground text-center">
                <div className="absolute inset-0 bg-gradient-to-tr from-violet-600/40 to-transparent" />
                <div className="relative z-10 container mx-auto px-6 max-w-3xl">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">Prêt à synchroniser nos dispo ?</h2>
                    <p className="text-xl mb-10 opacity-90">Rejoints le calendrier pour qu'on puisse s'organiser plus vite.</p>
                    {user ? (
                        <Button size="lg" variant="secondary" asChild className="h-14 px-10 text-lg rounded-full font-bold text-primary">
                            <Link href="/calendrier">Mon Calendrier</Link>
                        </Button>
                    ) : (
                        <Button size="lg" variant="secondary" asChild className="h-14 px-10 text-lg rounded-full font-bold text-primary">
                            <Link href="/inscription">Créer mon profil</Link>
                        </Button>
                    )}
                </div>
            </section>
        </div>
    );
}

// Composants internes pour la page Marketing
function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 border flex items-center justify-center mb-6 shadow-sm">
                {icon}
            </div>
            <h3 className="text-xl font-semibold mb-3">{title}</h3>
            <p className="text-muted-foreground leading-relaxed">{description}</p>
        </div>
    );
}

function StepCard({ number, title, description }: { number: string, title: string, description: string }) {
    return (
        <div className="relative z-10 bg-slate-50 dark:bg-slate-950 px-6">
            <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl mb-6 shadow-lg shadow-primary/30 mx-auto md:mx-0">
                {number}
            </div>
            <h3 className="text-2xl font-semibold mb-3 text-center md:text-left">{title}</h3>
            <p className="text-muted-foreground leading-relaxed text-center md:text-left">{description}</p>
        </div>
    );
}
