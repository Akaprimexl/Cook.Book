import CommunityRecipePage from '../../../components/CommunityRecipePage'

export default async function IcmaReseptDetalPage({ params }) {
  const { id } = await params
  return <CommunityRecipePage recipeId={id}/>
}
