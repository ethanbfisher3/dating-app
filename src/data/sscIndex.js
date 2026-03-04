import burgers_and_sandwiches from './ssc_deals/burgers_and_sandwiches'
import entertainment from './ssc_deals/entertainment'
import free_deals from './ssc_deals/free_deals'
import pizza from './ssc_deals/pizza'
import restaurants from './ssc_deals/restaurants'
import treats_and_drinks from './ssc_deals/treats_and_drinks'

const allDeals = [
  ...burgers_and_sandwiches,
  ...entertainment,
  ...free_deals,
  ...pizza,
  ...restaurants,
  ...treats_and_drinks,
]

export function findDealsForName(name) {
  if (!name) return []
  const norm = (s) =>
    (s || '')
      .toString()
      .toLowerCase()
      .replace(/[\W_]+/g, ' ')
      .trim()

  const nameNorm = norm(name)
  const tokens = nameNorm.split(/\s+/).filter(Boolean)

  return allDeals.filter((d) => {
    const dn = norm(d.name)
    if (!dn) return false
    // exact-ish contains
    if (dn.includes(nameNorm) || nameNorm.includes(dn)) return true
    // token matching
    for (const t of tokens) {
      if (dn.includes(t) || t.includes(dn)) return true
    }
    return false
  })
}

export default {
  allDeals,
  findDealsForName,
}
