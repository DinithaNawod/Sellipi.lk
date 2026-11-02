type Props = { title: string; image: string; className?: string };
export default function PageHero({ title, image, className = '' }: Props) {
  return <section className={`page-hero ${className}`} style={{ backgroundImage: `url(${image})` }}><h1>{title}</h1></section>;
}
