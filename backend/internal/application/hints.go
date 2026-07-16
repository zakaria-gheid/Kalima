package application

// Describer hints, generated per category and stored on every word row.
// Mirror of frontend/src/lib/hints.ts — keep the two in sync.

type hintPair struct {
	En string
	Ar string
}

var categoryHints = map[string]hintPair{
	"Home":           {"Something in the house. Describe the room it is in, its size, and what you use it for.", "شيء في البيت. صف الغرفة التي يوجد فيها وحجمه وفيمَ يُستخدم."},
	"Kitchen":        {"Used for cooking or eating. Describe how you use it in the kitchen.", "يُستخدم للطبخ أو الأكل. صف كيف تستعمله في المطبخ."},
	"Food":           {"You can eat or drink it. Describe its taste, color, and when people have it.", "يؤكل أو يشرب. صف طعمه ولونه ومتى نتناوله."},
	"Animals":        {"A living creature. Describe its size, where it lives, and its sound or movement.", "كائن حي. صف حجمه وأين يعيش وصوته أو حركته."},
	"Nature":         {"Found outdoors in nature. Describe where you see it and what it looks like.", "موجود في الطبيعة. صف أين تراه وكيف يبدو."},
	"Human Body":     {"A part of the body. Point near it and describe what it does.", "جزء من الجسم. أشر بالقرب منه وصف وظيفته."},
	"Family":         {"About people and family life. Describe who this person is or when this happens.", "عن الناس والعائلة. صف من يكون هذا الشخص أو متى يحدث هذا."},
	"Clothing":       {"Something you wear. Describe where on the body and in which season.", "شيء يُلبس. صف أين يوضع على الجسم وفي أي فصل."},
	"Transportation": {"About travel and vehicles. Describe how it moves and where you find it.", "عن السفر والمركبات. صف كيف يتحرك وأين تجده."},
	"Jobs":           {"A job or worker. Describe what this person does and where they work.", "مهنة أو عامل. صف ماذا يفعل هذا الشخص وأين يعمل."},
	"Sports":         {"About sport and games. Describe how it is played or done.", "عن الرياضة والألعاب. صف كيف يُلعب أو يُمارس."},
	"Science":        {"About science. Describe what it is used for, in a lab or in nature.", "عن العلوم. صف فيمَ يُستخدم في المختبر أو في الطبيعة."},
	"Technology":     {"A device or tech thing. Describe how people use it every day.", "جهاز أو شيء تقني. صف كيف يستعمله الناس يوميا."},
	"Geography":      {"A place or land feature. Describe where it is on a map and what it looks like.", "مكان أو تضاريس. صف موقعه على الخريطة وشكله."},
	"Space":          {"About the sky and space. Describe when and where you can see it.", "عن السماء والفضاء. صف متى وأين يمكن رؤيته."},
	"Music":          {"About music and sound. Describe how it sounds or how it is played.", "عن الموسيقى والصوت. صف كيف يبدو صوته أو كيف يُعزف."},
	"History":        {"From old times. Describe who used it and in which era.", "من الزمن القديم. صف من كان يستخدمه وفي أي عصر."},
	"Religion":       {"About faith and worship. Describe when or where people do or see it.", "عن الدين والعبادة. صف متى أو أين يفعله الناس أو يرونه."},
	"City":           {"A place in town. Describe what people do there.", "مكان في المدينة. صف ماذا يفعل الناس فيه."},
	"Office":         {"About work and office life. Describe when you use it at work.", "عن العمل والمكتب. صف متى تستخدمه في العمل."},
	"School":         {"About school and learning. Describe when you see or use it in class.", "عن المدرسة والتعلم. صف متى تراه أو تستخدمه في الصف."},
}

var fallbackHint = hintPair{
	En: "Describe what it looks like, where you find it, and what it is used for.",
	Ar: "صف شكله وأين يوجد وفيمَ يُستخدم.",
}

// HintsForCategory returns the English and Arabic describer hints for a category.
func HintsForCategory(category string) (en, ar string) {
	pair, ok := categoryHints[category]
	if !ok {
		pair = fallbackHint
	}
	return pair.En, pair.Ar
}
