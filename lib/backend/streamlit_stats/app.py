import streamlit as st
import json
import os
from datetime import datetime
import uuid

# Nom du fichier de sauvegarde local
DATA_FILE = 'campaign_stats.json'

# --- Fonctions utilitaires ---
def load_data():
    """Charge les données depuis le fichier JSON."""
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r') as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                return []
    return []

def save_data(data):
    """Sauvegarde les données dans le fichier JSON."""
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=4)

# --- Configuration de la page ---
st.set_page_config(page_title="Cold Email Tracker", layout="wide")

# Chargement des données en mémoire
data = load_data()

# --- Menu Latéral ---
st.sidebar.title("Navigation")
menu = st.sidebar.radio("Choisissez une option :", ["Nouvelle Analyse", "Historique (Consulter/Éditer)"])

# ==========================================
# PAGE 1 : NOUVELLE ANALYSE
# ==========================================
if menu == "Nouvelle Analyse":
    st.title("Nouvelle Analyse de Campagne 🚀")
    
    st.subheader("1. Métriques de la campagne")
    col1, col2, col3 = st.columns(3)
    
    total_sent = col1.number_input("Total Sent (Envoyés)", min_value=1, value=100)
    opportunity = col2.number_input("Opportunity (Réponses positives)", min_value=0, value=0)
    booked = col3.number_input("Booked (Appels réservés)", min_value=0, value=0)
    
    # Calculs automatiques
    reply_rate = (opportunity / total_sent) * 100 if total_sent > 0 else 0
    booking_rate = (booked / opportunity) * 100 if opportunity > 0 else 0
    emails_for_booking = int(total_sent / booked) if booked > 0 else "N/A"
    
    # Affichage des statistiques calculées
    st.write("---")
    scol1, scol2, scol3 = st.columns(3)
    scol1.metric("Positive Reply Rate", f"{reply_rate:.2f} %")
    scol2.metric("Booking Rate (par opportunité)", f"{booking_rate:.2f} %")
    scol3.metric("Emails needed for 1 Booking", str(emails_for_booking))
    st.write("---")
    
    st.subheader("2. Contenu utilisé")
    email_1 = st.text_area("Email 1 Copy", height=100)
    email_2 = st.text_area("Email 2 Copy", height=100)
    email_3 = st.text_area("Email 3 Copy", height=100)
    email_4 = st.text_area("Email 4 Copy", height=100)
    
    website_version = st.text_area("Website version used (Description de la landing page)", height=100)
    
    st.subheader("3. Rétrospective")
    improvement = st.text_area("Points d'amélioration pour la prochaine cohorte", height=100)
    
    if st.button("💾 Sauvegarder la campagne", type="primary"):
        new_entry = {
            "id": str(uuid.uuid4()),
            "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "total_sent": total_sent,
            "opportunity": opportunity,
            "booked": booked,
            "reply_rate": round(reply_rate, 2),
            "booking_rate": round(booking_rate, 2),
            "email_1": email_1,
            "email_2": email_2,
            "email_3": email_3,
            "email_4": email_4,
            "website_version": website_version,
            "improvement": improvement
        }
        data.append(new_entry)
        save_data(data)
        st.success("Données sauvegardées avec succès ! 🎉")

# ==========================================
# PAGE 2 : HISTORIQUE
# ==========================================
elif menu == "Historique (Consulter/Éditer)":
    st.title("Historique des Campagnes 🗂️")
    
    if not data:
        st.info("Aucune donnée n'a été sauvegardée pour le moment.")
    else:
        # Créer un dictionnaire pour le selectbox (Clé: Date + Infos, Valeur: l'objet campagne)
        options = {f"{entry['date']} | Sent: {entry['total_sent']} | Booked: {entry['booked']}": entry for entry in data}
        
        selected_key = st.selectbox("Sélectionne une campagne passée :", list(options.keys()))
        selected_entry = options[selected_key]
        
        # Trouver l'index de cet élément dans notre liste principale
        index = data.index(selected_entry)
        
        action = st.radio("Que veux-tu faire avec cette campagne ?", ["Consulter", "Éditer", "Supprimer"], horizontal=True)
        st.write("---")
        
        if action == "Consulter":
            st.subheader(f"Campagne du {selected_entry['date']}")
            c1, c2, c3 = st.columns(3)
            c1.metric("Total Sent", selected_entry['total_sent'])
            c2.metric("Positive Reply Rate", f"{selected_entry['reply_rate']} %")
            c3.metric("Booking Rate", f"{selected_entry['booking_rate']} %")
            
            st.write("**Emails utilisés :**")
            with st.expander("Voir les copies d'emails"):
                st.text(f"Email 1:\n{selected_entry['email_1']}")
                st.text(f"Email 2:\n{selected_entry['email_2']}")
                st.text(f"Email 3:\n{selected_entry['email_3']}")
                st.text(f"Email 4:\n{selected_entry['email_4']}")
                
            st.write("**Website Version :**", selected_entry['website_version'])
            st.write("**Points d'amélioration :**", selected_entry['improvement'])
            
        elif action == "Éditer":
            st.subheader("Mode Édition")
            
            # Pré-remplir les champs avec les données existantes
            edit_sent = st.number_input("Total Sent", value=selected_entry['total_sent'])
            edit_opp = st.number_input("Opportunity", value=selected_entry['opportunity'])
            edit_booked = st.number_input("Booked", value=selected_entry['booked'])
            
            edit_email_1 = st.text_area("Email 1 Copy", value=selected_entry['email_1'])
            edit_email_2 = st.text_area("Email 2 Copy", value=selected_entry['email_2'])
            edit_email_3 = st.text_area("Email 3 Copy", value=selected_entry['email_3'])
            edit_email_4 = st.text_area("Email 4 Copy", value=selected_entry['email_4'])
            
            edit_website = st.text_area("Website version", value=selected_entry['website_version'])
            edit_improvement = st.text_area("Points d'amélioration", value=selected_entry['improvement'])
            
            if st.button("Mettre à jour", type="primary"):
                # Recalculer les taux au cas où les nombres ont changé
                new_reply_rate = (edit_opp / edit_sent) * 100 if edit_sent > 0 else 0
                new_booking_rate = (edit_booked / edit_opp) * 100 if edit_opp > 0 else 0
                
                # Mettre à jour l'entrée
                data[index].update({
                    "total_sent": edit_sent,
                    "opportunity": edit_opp,
                    "booked": edit_booked,
                    "reply_rate": round(new_reply_rate, 2),
                    "booking_rate": round(new_booking_rate, 2),
                    "email_1": edit_email_1,
                    "email_2": edit_email_2,
                    "email_3": edit_email_3,
                    "email_4": edit_email_4,
                    "website_version": edit_website,
                    "improvement": edit_improvement
                })
                
                save_data(data)
                st.success("Campagne mise à jour avec succès ! (Recharge la page pour voir les changements)")
                
        elif action == "Supprimer":
            st.warning("⚠️ Es-tu sûr de vouloir supprimer cette campagne ? Cette action est irréversible.")
            if st.button("Oui, Supprimer définitivement"):
                data.pop(index)
                save_data(data)
                st.success("Campagne supprimée ! (Recharge la page)")